from pydantic import BaseModel, Field
from typing import Optional

class MomoCreatePaymentRequest(BaseModel):
    package_type: str = Field(..., description="MICRO_PASS_29K, MICRO_PASS_59K, EXPERT_REVIEW")
    amount: float = Field(..., description="Payment amount in VND")
    order_info: str = Field(..., description="Short order description")

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
