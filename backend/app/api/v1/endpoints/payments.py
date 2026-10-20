"""Thin Controller for Domain 13: MoMo Payments & Escrow."""

from fastapi import APIRouter, status
from app.modules.payments import PaymentService
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    MomoIpnResponse,
    OrderStatusResponse,
)

router = APIRouter(prefix="/payments/momo", tags=["Domain 13: MoMo Payments & Escrow"])


@router.post("/create-qr", response_model=MomoCreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_momo_payment_qr(payload: MomoCreatePaymentRequest):
    """BEL-202: Generates MoMo dynamic QR code and creates a PENDING order."""
    return PaymentService.create_qr(payload)


@router.post("/ipn", response_model=MomoIpnResponse, status_code=status.HTTP_200_OK)
async def momo_ipn_webhook(payload: MomoIpnRequest):
    """BEL-203: MoMo IPN Receiver with Idempotency guard and HMAC validation."""
    return PaymentService.handle_ipn(payload)


@router.get("/order-status/{order_id}", response_model=OrderStatusResponse, status_code=status.HTTP_200_OK)
async def check_order_status(order_id: str):
    """Poll order status for frontend payment dialog."""
    return PaymentService.get_order_status(order_id)
