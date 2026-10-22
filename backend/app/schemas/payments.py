from typing import List, Optional
from pydantic import BaseModel, Field


class MomoCreatePaymentRequest(BaseModel):
    package_type: str = Field(..., description="MICRO_PASS_29K, MICRO_PASS_59K, EXPERT_REVIEW")
    amount: float = Field(..., description="Payment amount in VND")
    order_info: str = Field(..., description="Short order description")
    review_order_id: Optional[str] = Field(None, description="Optional CV review order UUID to link payment_reference")


class MomoCreatePaymentResponse(BaseModel):
    order_id: str
    pay_url: str
    qr_code_url: str
    amount: float
    message: str


class MomoIpnRequest(BaseModel):
    order_id: str
    trans_id: str
    result_code: int = 0
    signature: str
    amount: float


class MomoIpnResponse(BaseModel):
    message: str
    status: str
    order_id: str


class OrderStatusResponse(BaseModel):
    order_id: str
    status: str
    amount: float
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
    amount_vnd: int = Field(..., gt=0, description="Top-up amount in VND")
    payment_method: Optional[str] = "MoMo QR"


class WalletPayRequest(BaseModel):
    amount_vnd: int = Field(..., gt=0, description="Payment amount in VND")
    target_type: Optional[str] = "SYSTEM_PURCHASE"
    purpose: Optional[str] = None
    order_id: Optional[str] = None
    description: str = "Thanh toán dịch vụ Belooga"
