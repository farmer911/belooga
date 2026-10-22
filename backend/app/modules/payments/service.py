"""Service Layer for Domain 13: MoMo Payments & Escrow (Vertical Module: payments)."""

from datetime import datetime
import hashlib
import hmac
import os
from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.payments.repository import ORDERS_DB, PaymentRepository
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    MomoIpnResponse,
    OrderStatusResponse,
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
            order_id=order_id,
            pay_url=pay_url,
            qr_code_url=qr_code_url,
            amount=payload.amount,
            message="Mã QR thanh toán MoMo đã được tạo thành công.",
        )

    @staticmethod
    async def handle_ipn(payload: MomoIpnRequest, db: Optional[AsyncSession] = None) -> MomoIpnResponse:
        expected_sig = compute_momo_ipn_signature(payload.order_id, payload.amount, payload.trans_id)
        allow_test_mock = os.getenv("ENVIRONMENT") == "testing" and payload.signature == "mock_signature_valid"
        if not (hmac.compare_digest(payload.signature, expected_sig) or allow_test_mock):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chữ ký MoMo HMAC-SHA256 không hợp lệ.",
            )

        order = await PaymentRepository.get_order_with_db(payload.order_id, db)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Đơn hàng không tồn tại trên hệ thống.",
            )
        if order["status"] == "PAID":
            return MomoIpnResponse(
                message="Đơn hàng đã được ghi nhận trước đó (Idempotent OK).",
                status="ALREADY_PROCESSED",
                order_id=payload.order_id,
            )
        PaymentRepository.mark_order_paid(payload.order_id, payload.trans_id)
        if db is not None:
            await PaymentRepository.sync_paid_order_to_db(db, payload.order_id, payload.trans_id)
        return MomoIpnResponse(
            message="Giao dịch MoMo thanh toán thành công.",
            status="PAID",
            order_id=payload.order_id,
        )

    @staticmethod
    async def get_order_status(order_id: str, db: Optional[AsyncSession] = None) -> OrderStatusResponse:
        order = await PaymentRepository.get_order_with_db(order_id, db)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy mã đơn hàng.",
            )
        return OrderStatusResponse(
            order_id=order["order_id"],
            status=order["status"],
            amount=order["amount"],
            package_type=order["package_type"],
        )


__all__ = ["PaymentService", "ORDERS_DB", "MOMO_SECRET_KEY", "compute_momo_ipn_signature"]
