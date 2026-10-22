"""Thin Controller for Domain 13: MoMo Payments, User Wallet Ledger & Escrow."""

from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import AuthenticatedUser, get_current_user_optional
from app.modules.payments import PaymentService
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    MomoIpnResponse,
    OrderStatusResponse,
    UserWalletStateResponse,
    WalletPayRequest,
    WalletTopupRequest,
)

router = APIRouter(tags=["Domain 13: MoMo Payments & Escrow"])


def _wallet_key(user: Optional[AuthenticatedUser]) -> str:
    return str(user.id) if user else "demo_candidate_wallet"


@router.post("/payments/momo/create-qr", response_model=MomoCreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_momo_payment_qr(
    payload: MomoCreatePaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """BEL-202: Generates MoMo dynamic QR code and creates a PENDING order."""
    return await PaymentService.create_qr(payload, db)


@router.post("/payments/momo/ipn", response_model=MomoIpnResponse, status_code=status.HTTP_200_OK)
async def momo_ipn_webhook(payload: MomoIpnRequest, db: AsyncSession = Depends(get_db)):
    """BEL-203: MoMo IPN Receiver with Idempotency guard, HMAC-SHA256 validation, and DB sync."""
    return await PaymentService.handle_ipn(payload, db)


@router.get("/payments/momo/order-status/{order_id}", response_model=OrderStatusResponse, status_code=status.HTTP_200_OK)
async def check_order_status(order_id: str, db: AsyncSession = Depends(get_db)):
    """Poll order status for frontend payment dialog."""
    return await PaymentService.get_order_status(order_id, db)


@router.get("/wallet/", response_model=UserWalletStateResponse)
async def get_user_wallet_state(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Return available balance, escrow locked balance, and transaction ledger for the current user."""
    return await PaymentService.get_wallet(db, _wallet_key(current_user))


@router.get("/wallet/balance", response_model=UserWalletStateResponse)
async def get_user_wallet_balance(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Mobile Wallet balance & ledger summary endpoint (BEL-225 parity)."""
    return await PaymentService.get_wallet(db, _wallet_key(current_user))


@router.post("/wallet/topup", response_model=UserWalletStateResponse)
async def topup_user_wallet(
    payload: WalletTopupRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Instant wallet top-up and ledger entry creation."""
    return await PaymentService.topup_wallet(db, _wallet_key(current_user), payload)


@router.post("/wallet/pay", response_model=UserWalletStateResponse)
async def pay_with_user_wallet(
    payload: WalletPayRequest,
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Deduct available wallet balance for Micro-Pass or Expert Escrow Lock."""
    return await PaymentService.pay_with_wallet(db, _wallet_key(current_user), payload)
