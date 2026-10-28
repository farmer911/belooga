"""Service Layer for Domain 13: MoMo Payments, User Wallet Ledger & Escrow (Vertical Module: payments).

Money only enters a wallet through a MoMo IPN whose HMAC-SHA256 signature verifies
against MOMO_SECRET_KEY; prices for packages are decided server-side.
"""

from datetime import datetime, timezone
import hashlib
import hmac
import os
from typing import Any, Optional
import uuid

from fastapi import HTTPException, status
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.payments.repository import PaymentRepository
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    OrderStatusResponse,
    UserWalletStateResponse,
    WalletPayRequest,
    WalletTopupRequest,
    WalletTransactionDTO,
)

PACKAGE_PRICES_VND = {"MICRO_PASS_29K": 29_000, "MICRO_PASS_59K": 59_000}
VND_PER_USD_CENT = 250  # cv_review_orders.amount_paid_cents is priced in USD cents
MOMO_DEFAULT_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create"
IPN_SIGNATURE_FIELDS = (
    "amount", "extraData", "message", "orderId", "orderInfo", "orderType", "partnerCode",
    "payType", "requestId", "responseTime", "resultCode", "transId",
)


def _is_production() -> bool:
    return os.getenv("ENVIRONMENT", "development").lower() in ("production", "prod", "staging")


def get_momo_secret_key() -> str:
    secret = os.getenv("MOMO_SECRET_KEY")
    if not secret:
        if _is_production():
            raise RuntimeError("FATAL SECURITY ERROR: MOMO_SECRET_KEY environment variable is required in production!")
        return "belooga_momo_secret_key_mock_hmac"
    return secret


MOMO_SECRET_KEY = get_momo_secret_key()


def sign_momo(raw: str) -> str:
    return hmac.new(get_momo_secret_key().encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()


def momo_ipn_raw_signature(fields: dict[str, Any]) -> str:
    """Raw string MoMo signs for an IPN: accessKey first, then the IPN fields in alphabetical order."""
    parts = [f"accessKey={os.getenv('MOMO_ACCESS_KEY', '')}"]
    parts += [f"{k}={fields.get(k, '')}" for k in IPN_SIGNATURE_FIELDS]
    return "&".join(parts)


def _identity(wallet_key: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(wallet_key))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required for wallet")


def _parse_uuid(raw: Optional[str], field: str) -> uuid.UUID:
    try:
        return uuid.UUID(str(raw))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field} must be a UUID")


async def _request_momo_payment(order_id: str, amount_vnd: int, order_info: str) -> dict[str, Any]:
    partner_code, access_key = os.getenv("MOMO_PARTNER_CODE"), os.getenv("MOMO_ACCESS_KEY")
    if not partner_code or not access_key or not os.getenv("MOMO_SECRET_KEY"):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="MoMo payments are not configured")
    public_api = os.getenv("PUBLIC_API_URL", "http://localhost:8080").rstrip("/")
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    body: dict[str, Any] = {
        "partnerCode": partner_code, "requestId": order_id, "amount": amount_vnd, "orderId": order_id,
        "orderInfo": order_info, "redirectUrl": f"{frontend}/workspace/wallet?momo_order={order_id}",
        "ipnUrl": f"{public_api}/v1/payments/momo/ipn", "requestType": "captureWallet", "extraData": "",
        "lang": "vi",
    }
    raw = "&".join(
        f"{k}={v}" for k, v in sorted({**body, "accessKey": access_key}.items()) if k != "lang"
    )
    body["signature"] = sign_momo(raw)
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.post(os.getenv("MOMO_ENDPOINT", MOMO_DEFAULT_ENDPOINT), json=body)
    data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
    if res.status_code != 200 or data.get("resultCode") != 0 or not data.get("payUrl"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"MoMo rejected the payment request: {data.get('message') or res.status_code}",
        )
    return data


class PaymentService:
    @staticmethod
    async def create_payment(
        db: AsyncSession, identity_id: uuid.UUID, payload: MomoCreatePaymentRequest
    ) -> MomoCreatePaymentResponse:
        repo = PaymentRepository(db)
        review_order_id: Optional[uuid.UUID] = None
        if payload.package_type == "WALLET_TOPUP":
            amount = WalletTopupRequest(amount_vnd=payload.amount or 0).amount_vnd
        elif payload.package_type == "EXPERT_REVIEW":
            review_order_id = _parse_uuid(payload.review_order_id, "review_order_id")
            review = await repo.get_review_order(review_order_id)
            if not review or review["candidate_identity_id"] != identity_id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review order not found")
            if review["order_status"] != "pending_payment":
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Review order is not awaiting payment")
            amount = int(review["amount_paid_cents"]) * VND_PER_USD_CENT
        else:
            amount = PACKAGE_PRICES_VND[payload.package_type]

        order_id = f"BLG-{datetime.now(timezone.utc):%Y%m%d%H%M%S}-{uuid.uuid4().hex[:8]}"
        await repo.create_order(order_id, identity_id, payload.package_type, amount, review_order_id)
        await db.commit()
        try:
            momo = await _request_momo_payment(order_id, amount, payload.order_info)
        except HTTPException:
            await repo.set_order_status(order_id, "FAILED", None)
            await db.commit()
            raise
        return MomoCreatePaymentResponse(
            order_id=order_id, pay_url=momo["payUrl"], qr_code_url=momo.get("qrCodeUrl"),
            deeplink=momo.get("deeplink"), amount=amount, message="Đã tạo yêu cầu thanh toán MoMo.",
        )

    @staticmethod
    async def handle_ipn(db: AsyncSession, payload: MomoIpnRequest) -> None:
        fields = payload.model_dump()
        expected_sig = sign_momo(momo_ipn_raw_signature(fields))
        if payload.partnerCode != os.getenv("MOMO_PARTNER_CODE", payload.partnerCode) or not hmac.compare_digest(
            payload.signature, expected_sig
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chữ ký MoMo HMAC-SHA256 không hợp lệ.")
        repo = PaymentRepository(db)
        order = await repo.get_order(payload.orderId, for_update=True)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn hàng không tồn tại trên hệ thống.")
        if order["status"] == "PAID":
            return
        if payload.resultCode != 0:
            await repo.set_order_status(payload.orderId, "FAILED", str(payload.transId))
            await db.commit()
            return
        if payload.amount != order["amount_vnd"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Số tiền IPN không khớp đơn hàng.")

        await repo.set_order_status(payload.orderId, "PAID", str(payload.transId))
        if order["package_type"] == "WALLET_TOPUP":
            await repo.lock_wallet(order["identity_id"])
            await repo.apply_wallet_delta(order["identity_id"], order["amount_vnd"], 0)
            await repo.add_transaction(
                order["identity_id"], "TOPUP", order["amount_vnd"], "Nạp tiền vào Ví Belooga qua MoMo",
                payload.orderId, "COMPLETED",
            )
        elif order["package_type"] == "EXPERT_REVIEW" and order["review_order_id"]:
            await repo.mark_review_order(order["review_order_id"], "paid", f"{payload.orderId}:{payload.transId}")
        await db.commit()
        await platform_cache.invalidate_prefix("analytics:")

    @staticmethod
    async def get_order_status(db: AsyncSession, identity_id: uuid.UUID, order_id: str) -> OrderStatusResponse:
        order = await PaymentRepository(db).get_order(order_id)
        if not order or order["identity_id"] != identity_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy mã đơn hàng.")
        return OrderStatusResponse(
            order_id=order["order_id"], status=order["status"],
            amount=order["amount_vnd"], package_type=order["package_type"],
        )

    @staticmethod
    async def get_wallet(db: AsyncSession, wallet_key: str) -> UserWalletStateResponse:
        identity_id = _identity(wallet_key)
        repo = PaymentRepository(db)
        bal = await repo.get_wallet(identity_id)
        txs = await repo.list_transactions(identity_id)
        return UserWalletStateResponse(
            available_balance_vnd=int(bal["available_balance_vnd"]),
            escrow_locked_vnd=int(bal["escrow_locked_vnd"]),
            transactions=[
                WalletTransactionDTO(**{**t, "id": str(t["id"]), "created_at": t["created_at"].isoformat()})
                for t in txs
            ],
        )

    @staticmethod
    async def topup_wallet(
        db: AsyncSession, wallet_key: str, payload: WalletTopupRequest
    ) -> MomoCreatePaymentResponse:
        return await PaymentService.create_payment(
            db, _identity(wallet_key),
            MomoCreatePaymentRequest(
                package_type="WALLET_TOPUP", amount=payload.amount_vnd, order_info="Nạp tiền Ví Belooga"
            ),
        )

    @staticmethod
    async def pay_with_wallet(
        db: AsyncSession, wallet_key: str, payload: WalletPayRequest
    ) -> UserWalletStateResponse:
        identity_id = _identity(wallet_key)
        repo = PaymentRepository(db)
        is_escrow = payload.target_type == "EXPERT_ESCROW_LOCK" or payload.purpose == "EXPERT_ESCROW"
        review_order_id: Optional[uuid.UUID] = None
        if is_escrow:
            review_order_id = _parse_uuid(payload.order_id, "order_id")
            review = await repo.get_review_order(review_order_id, for_update=True)
            if not review or review["candidate_identity_id"] != identity_id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review order not found")
            if review["order_status"] != "pending_payment":
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Review order is not awaiting payment")
            if payload.amount_vnd != int(review["amount_paid_cents"]) * VND_PER_USD_CENT:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Escrow amount does not match order price")

        wallet = await repo.lock_wallet(identity_id)
        if int(wallet["available_balance_vnd"]) < payload.amount_vnd:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví.",
            )
        reference = payload.order_id or f"PAY-{uuid.uuid4().hex[:8].upper()}"
        if is_escrow and review_order_id is not None:
            await repo.apply_wallet_delta(identity_id, -payload.amount_vnd, payload.amount_vnd)
            await repo.add_transaction(
                identity_id, "EXPERT_ESCROW_LOCK", payload.amount_vnd, payload.description, reference, "LOCKED_IN_ESCROW"
            )
            await repo.mark_review_order(review_order_id, "in_review", f"WALLET-ESCROW-{uuid.uuid4().hex[:8].upper()}")
        else:
            await repo.apply_wallet_delta(identity_id, -payload.amount_vnd, 0)
            await repo.add_transaction(
                identity_id, "SYSTEM_PURCHASE", payload.amount_vnd, payload.description, reference, "COMPLETED"
            )
        await db.commit()
        await platform_cache.invalidate_prefix("analytics:")
        return await PaymentService.get_wallet(db, str(identity_id))

    @staticmethod
    async def release_escrow_for_order(
        db: AsyncSession, wallet_key: str, order_id: str, amount_vnd: int = 0, expert_name: str = "Senior Reviewer"
    ) -> UserWalletStateResponse:
        """Release the escrow locked for `order_id`; orders paid directly via MoMo have no escrow and are a no-op."""
        _ = amount_vnd  # the locked ledger entry is the source of truth for the amount
        identity_id = _identity(wallet_key)
        repo = PaymentRepository(db)
        await repo.lock_wallet(identity_id)
        lock = await repo.find_escrow_lock(identity_id, order_id)
        if lock:
            await repo.apply_wallet_delta(identity_id, 0, -int(lock["amount_vnd"]))
            await repo.set_transaction_status(lock["id"], "RELEASED")
            await repo.add_transaction(
                identity_id, "EXPERT_ESCROW_RELEASE", int(lock["amount_vnd"]),
                f"Nghiệm thu & Giải ngân Escrow cho Expert {expert_name} (Đơn #{order_id[:8]})", order_id, "RELEASED",
            )
        await db.commit()
        await platform_cache.invalidate_prefix("analytics:")
        return await PaymentService.get_wallet(db, str(identity_id))


__all__ = ["PaymentService", "MOMO_SECRET_KEY", "sign_momo", "momo_ipn_raw_signature", "get_momo_secret_key"]
