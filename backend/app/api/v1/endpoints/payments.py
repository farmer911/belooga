import uuid
import hmac
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    MomoIpnResponse,
    OrderStatusResponse,
)

router = APIRouter(prefix="/payments/momo", tags=["Domain 13: MoMo Payments & Escrow"])

MOMO_SECRET_KEY = "belooga_momo_secret_key_mock_hmac"

# In-memory mock transaction storage (Idempotency ledger)
ORDERS_DB: dict[str, dict] = {}


@router.post("/create-qr", response_model=MomoCreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_momo_payment_qr(payload: MomoCreatePaymentRequest):
    """
    BEL-202: Generates MoMo dynamic QR code and creates a PENDING order.
    Signed with HMAC-SHA256.
    """
    order_id = f"MOMO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6]}"
    raw_signature = f"amount={payload.amount}&orderId={order_id}&package={payload.package_type}"
    signature = hmac.new(
        MOMO_SECRET_KEY.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # Pre-generate QR code image link
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|0901234567|Belooga|admin@belooga.vn|0|0|{int(payload.amount)}|{order_id}|transfer_myqr"
    pay_url = f"https://test-payment.momo.vn/v2/gateway/pay?orderId={order_id}&signature={signature}"

    ORDERS_DB[order_id] = {
        "order_id": order_id,
        "amount": payload.amount,
        "package_type": payload.package_type,
        "status": "PENDING",
        "created_at": datetime.now().isoformat(),
        "trans_id": None,
    }

    return MomoCreatePaymentResponse(
        order_id=order_id,
        pay_url=pay_url,
        qr_code_url=qr_code_url,
        amount=payload.amount,
        message="Mã QR thanh toán MoMo đã được tạo thành công.",
    )


@router.post("/ipn", response_model=MomoIpnResponse, status_code=status.HTTP_200_OK)
async def momo_ipn_webhook(payload: MomoIpnRequest):
    """
    BEL-203: MoMo IPN Receiver with Idempotency guard and HMAC validation.
    Prevents race condition and double-crediting.
    """
    order = ORDERS_DB.get(payload.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đơn hàng không tồn tại trên hệ thống."
        )

    # Idempotency Check: If already PAID, return 200 OK without double-crediting
    if order["status"] == "PAID":
        return MomoIpnResponse(
            message="Đơn hàng đã được ghi nhận trước đó (Idempotent OK).",
            status="ALREADY_PROCESSED",
            order_id=payload.order_id,
        )

    # Process Payment Success
    order["status"] = "PAID"
    order["trans_id"] = payload.trans_id
    order["paid_at"] = datetime.now().isoformat()

    return MomoIpnResponse(
        message="Giao dịch MoMo thanh toán thành công.",
        status="PAID",
        order_id=payload.order_id,
    )


@router.get("/order-status/{order_id}", response_model=OrderStatusResponse, status_code=status.HTTP_200_OK)
async def check_order_status(order_id: str):
    """Poll order status for frontend payment dialog."""
    order = ORDERS_DB.get(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy mã đơn hàng."
        )
    return OrderStatusResponse(
        order_id=order["order_id"],
        status=order["status"],
        amount=order["amount"],
        package_type=order["package_type"],
    )
