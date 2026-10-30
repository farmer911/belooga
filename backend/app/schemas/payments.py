from typing import List, Literal, Optional
from pydantic import BaseModel, Field

PackageType = Literal["MICRO_PASS_29K", "MICRO_PASS_59K", "EXPERT_REVIEW", "WALLET_TOPUP"]


class MomoCreatePaymentRequest(BaseModel):
    package_type: PackageType
    order_info: str = Field(..., min_length=1, max_length=255, description="Short order description")
    amount: Optional[int] = Field(None, description="Ignored except for WALLET_TOPUP; prices are server-side")
    review_order_id: Optional[str] = Field(None, description="CV review order UUID (required for EXPERT_REVIEW)")


class MomoCreatePaymentResponse(BaseModel):
    order_id: str
    pay_url: str
    qr_code_url: Optional[str] = None
    deeplink: Optional[str] = None
    amount: int
    message: str


class MomoIpnRequest(BaseModel):
    """MoMo AIO v2 IPN body (field names exactly as MoMo sends them)."""

    partnerCode: str
    orderId: str
    requestId: str
    amount: int
    orderInfo: str = ""
    orderType: str = ""
    transId: int | str
    resultCode: int
    message: str = ""
    payType: str = ""
    responseTime: int | str
    extraData: str = ""
    signature: str


class OrderStatusResponse(BaseModel):
    order_id: str
    status: str
    amount: int
    package_type: str


class WalletTransactionDTO(BaseModel):
    id: str
    tx_type: str
    amount_vnd: int
    description: str
    reference_id: Optional[str] = None
    status: str
    created_at: str


class UserWalletStateResponse(BaseModel):
    available_balance_vnd: int
    escrow_locked_vnd: int
    transactions: List[WalletTransactionDTO] = Field(default_factory=list)


class WalletTopupRequest(BaseModel):
    amount_vnd: int = Field(..., ge=10_000, le=50_000_000, description="Top-up amount in VND")


class WalletPayRequest(BaseModel):
    amount_vnd: int = Field(..., gt=0, description="Payment amount in VND")
    target_type: Optional[str] = "SYSTEM_PURCHASE"
    purpose: Optional[str] = None
    order_id: Optional[str] = None
    description: str = Field("Thanh toán dịch vụ Belooga", max_length=500)
