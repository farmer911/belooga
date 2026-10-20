"""Service Layer for Domain 13: MoMo Payments & Escrow (Vertical Module: payments)."""

import hashlib
import hmac
import uuid
from datetime import datetime
from fastapi import HTTPException, status

from app.modules.payments.repository import ORDERS_DB, PaymentRepository
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    MomoIpnResponse,
    OrderStatusResponse,
)

MOMO_SECRET_KEY = "belooga_momo_secret_key_mock_hmac"


class PaymentService:
    @staticmethod
    def create_qr(payload: MomoCreatePaymentRequest) -> MomoCreatePaymentResponse:
        order_id = f"MOMO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
        raw_sig = f"amount={payload.amount}&orderId={order_id}&package={payload.package_type}"
        sig = hmac.new(MOMO_SECRET_KEY.encode("utf-8"), raw_sig.encode("utf-8"), hashlib.sha256).hexdigest()

        qr_code_url = (
            f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data="
            f"2|99|0901234567|Belooga|admin@belooga.vn|0|0|{int(payload.amount)}|{order_id}|transfer_myqr"
        )
        pay_url = f"https://test-payment.momo.vn/v2/gateway/pay?orderId={order_id}&signature={sig}"

        PaymentRepository.create_order(order_id, payload.amount, payload.package_type)
        return MomoCreatePaymentResponse(
            order_id=order_id,
            pay_url=pay_url,
            qr_code_url=qr_code_url,
            amount=payload.amount,
            message="Mã QR thanh toán MoMo đã được tạo thành công.",
        )

    @staticmethod
    def handle_ipn(payload: MomoIpnRequest) -> MomoIpnResponse:
        order = PaymentRepository.get_order(payload.order_id)
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
        return MomoIpnResponse(
            message="Giao dịch MoMo thanh toán thành công.",
            status="PAID",
            order_id=payload.order_id,
        )

    @staticmethod
    def get_order_status(order_id: str) -> OrderStatusResponse:
        order = PaymentRepository.get_order(order_id)
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


__all__ = ["PaymentService", "ORDERS_DB", "MOMO_SECRET_KEY"]
