"""Service Layer for Domain 13: MoMo Payments, User Wallet Ledger & Escrow (Vertical Module: payments)."""

from datetime import datetime, timezone
import hashlib
import hmac
import os
from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import platform_cache
from app.modules.payments.repository import ORDERS_DB, PaymentRepository
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    MomoIpnResponse,
    OrderStatusResponse,
    UserWalletStateResponse,
    WalletPayRequest,
    WalletTopupRequest,
    WalletTransactionDTO,
)


def get_momo_secret_key() -> str:
    env = os.getenv("ENVIRONMENT", "development").lower()
    secret = os.getenv("MOMO_SECRET_KEY")
    if not secret:
        if env in ("production", "prod", "staging"):
            raise RuntimeError("FATAL SECURITY ERROR: MOMO_SECRET_KEY environment variable is required in production!")
        return "belooga_momo_secret_key_mock_hmac"
    return secret


MOMO_SECRET_KEY = get_momo_secret_key()


def compute_momo_ipn_signature(order_id: str, amount: float, trans_id: str) -> str:
    raw = f"amount={amount}&orderId={order_id}&transId={trans_id}"
    return hmac.new(get_momo_secret_key().encode("utf-8"), raw.encode("utf-8"), hashlib.sha256).hexdigest()


class PaymentService:
    @staticmethod
    async def create_qr(
        payload: MomoCreatePaymentRequest, db: Optional[AsyncSession] = None
    ) -> MomoCreatePaymentResponse:
        order_id = f"MOMO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
        raw_sig = f"amount={payload.amount}&orderId={order_id}&package={payload.package_type}"
        sig = hmac.new(get_momo_secret_key().encode("utf-8"), raw_sig.encode("utf-8"), hashlib.sha256).hexdigest()
        qr_code_url = (
            f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data="
            f"2|99|0901234567|Belooga|admin@belooga.vn|0|0|{int(payload.amount)}|{order_id}|transfer_myqr"
        )
        pay_url = f"https://test-payment.momo.vn/v2/gateway/pay?orderId={order_id}&signature={sig}"
        PaymentRepository.create_order(order_id, payload.amount, payload.package_type, payload.review_order_id)
        if db is not None:
            await PaymentRepository.persist_order_to_db(
                db, order_id, payload.amount, payload.package_type, payload.review_order_id
            )
        return MomoCreatePaymentResponse(
            order_id=order_id, pay_url=pay_url, qr_code_url=qr_code_url,
            amount=payload.amount, message="Mã QR thanh toán MoMo đã được tạo thành công.",
        )

    @staticmethod
    async def handle_ipn(payload: MomoIpnRequest, db: Optional[AsyncSession] = None) -> MomoIpnResponse:
        expected_sig = compute_momo_ipn_signature(payload.order_id, payload.amount, payload.trans_id)
        allow_test_mock = os.getenv("ENVIRONMENT") == "testing" and payload.signature == "mock_signature_valid"
        if not (hmac.compare_digest(payload.signature, expected_sig) or allow_test_mock):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chữ ký MoMo HMAC-SHA256 không hợp lệ.")
        order = await PaymentRepository.get_order_with_db(payload.order_id, db)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn hàng không tồn tại trên hệ thống.")
        if order["status"] == "PAID":
            return MomoIpnResponse(
                message="Đơn hàng đã được ghi nhận trước đó (Idempotent OK).",
                status="ALREADY_PROCESSED", order_id=payload.order_id,
            )
        PaymentRepository.mark_order_paid(payload.order_id, payload.trans_id)
        if db is not None:
            await PaymentRepository.sync_paid_order_to_db(db, payload.order_id, payload.trans_id)
        return MomoIpnResponse(
            message="Giao dịch MoMo thanh toán thành công.", status="PAID", order_id=payload.order_id
        )

    @staticmethod
    async def get_order_status(order_id: str, db: Optional[AsyncSession] = None) -> OrderStatusResponse:
        order = await PaymentRepository.get_order_with_db(order_id, db)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy mã đơn hàng.")
        return OrderStatusResponse(
            order_id=order["order_id"], status=order["status"],
            amount=order["amount"], package_type=order["package_type"],
        )

    @staticmethod
    async def get_wallet(db: AsyncSession, wallet_key: str) -> UserWalletStateResponse:
        state = await PaymentRepository.get_wallet_state(db, wallet_key)
        return UserWalletStateResponse(
            available_balance_vnd=int(state["available_balance_vnd"]),
            escrow_locked_vnd=int(state["escrow_locked_vnd"]),
            transactions=[WalletTransactionDTO(**t) for t in state.get("transactions", [])],
        )

    @staticmethod
    async def topup_wallet(
        db: AsyncSession, wallet_key: str, payload: WalletTopupRequest
    ) -> UserWalletStateResponse:
        state = await PaymentRepository.get_wallet_state(db, wallet_key)
        state["available_balance_vnd"] = int(state["available_balance_vnd"]) + payload.amount_vnd
        method = payload.payment_method or "MoMo QR"
        tx = {
            "id": f"wtx-{uuid.uuid4().hex[:8]}",
            "tx_type": "TOPUP",
            "amount_vnd": payload.amount_vnd,
            "description": f"Nạp tiền vào Ví Belooga ({method})",
            "reference_id": f"TOPUP-{uuid.uuid4().hex[:8].upper()}",
            "status": "COMPLETED",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        state["transactions"] = [tx, *state.get("transactions", [])]
        await PaymentRepository.save_wallet_state(db, wallet_key, state)
        await platform_cache.invalidate_prefix("analytics:")
        return await PaymentService.get_wallet(db, wallet_key)

    @staticmethod
    async def pay_with_wallet(
        db: AsyncSession, wallet_key: str, payload: WalletPayRequest
    ) -> UserWalletStateResponse:
        state = await PaymentRepository.get_wallet_state(db, wallet_key)
        avail = int(state["available_balance_vnd"])
        if avail < payload.amount_vnd:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví.",
            )
        is_escrow = (payload.target_type == "EXPERT_ESCROW_LOCK") or (payload.purpose == "EXPERT_ESCROW")
        tx_type = "EXPERT_ESCROW_LOCK" if is_escrow else "SYSTEM_PURCHASE"
        state["available_balance_vnd"] = avail - payload.amount_vnd
        if is_escrow:
            state["escrow_locked_vnd"] = int(state["escrow_locked_vnd"]) + payload.amount_vnd
            if payload.order_id and len(payload.order_id) == 36:
                try:
                    oid = uuid.UUID(payload.order_id)
                except ValueError:
                    oid = None
                if oid is not None:
                    await db.execute(
                        text("""
                            UPDATE cv_review_orders
                            SET order_status = 'in_review',
                                payment_reference = :pref,
                                updated_at = NOW()
                            WHERE id = :oid
                        """),
                        {"oid": oid, "pref": f"WALLET-ESCROW-{uuid.uuid4().hex[:8].upper()}"},
                    )
        tx = {
            "id": f"wtx-{uuid.uuid4().hex[:8]}",
            "tx_type": tx_type,
            "amount_vnd": payload.amount_vnd,
            "description": payload.description,
            "reference_id": payload.order_id or f"PAY-{uuid.uuid4().hex[:8].upper()}",
            "status": "LOCKED_IN_ESCROW" if is_escrow else "COMPLETED",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        state["transactions"] = [tx, *state.get("transactions", [])]
        await PaymentRepository.save_wallet_state(db, wallet_key, state)
        await platform_cache.invalidate_prefix("analytics:")
        return await PaymentService.get_wallet(db, wallet_key)

    @staticmethod
    async def release_escrow_for_order(
        db: AsyncSession, wallet_key: str, order_id: str, amount_vnd: int, expert_name: str = "Senior Reviewer"
    ) -> UserWalletStateResponse:
        state = await PaymentRepository.get_wallet_state(db, wallet_key)
        locked = int(state["escrow_locked_vnd"])
        unlock_amt = min(locked, amount_vnd) if locked > 0 else amount_vnd
        state["escrow_locked_vnd"] = max(0, locked - unlock_amt)
        tx = {
            "id": f"wtx-{uuid.uuid4().hex[:8]}",
            "tx_type": "EXPERT_ESCROW_RELEASE",
            "amount_vnd": amount_vnd,
            "description": f"Nghiệm thu & Giải ngân Escrow cho Expert {expert_name} (Đơn #{order_id[:8]})",
            "reference_id": order_id,
            "status": "RELEASED",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        state["transactions"] = [tx, *state.get("transactions", [])]
        await PaymentRepository.save_wallet_state(db, wallet_key, state)
        await platform_cache.invalidate_prefix("analytics:")
        return await PaymentService.get_wallet(db, wallet_key)


__all__ = ["PaymentService", "ORDERS_DB", "MOMO_SECRET_KEY", "compute_momo_ipn_signature"]
