"""Thin Controller for Domain 13: MoMo Payments, User Wallet Ledger & Escrow."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_read_db
from app.core.security import AuthenticatedUser, get_current_user
from app.modules.payments import PaymentService
from app.schemas.payments import (
    MomoCreatePaymentRequest,
    MomoCreatePaymentResponse,
    MomoIpnRequest,
    OrderStatusResponse,
    UserWalletStateResponse,
    WalletPayRequest,
    WalletTopupRequest,
)

router = APIRouter(tags=["Domain 13: MoMo Payments & Escrow"])


@router.post("/payments/momo/create-qr", response_model=MomoCreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_momo_payment_qr(
    payload: MomoCreatePaymentRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a PENDING order and a MoMo payment request; the price is decided server-side."""
    return await PaymentService.create_payment(db, current_user.id, payload)


@router.post("/payments/momo/ipn", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def momo_ipn_webhook(payload: MomoIpnRequest, db: AsyncSession = Depends(get_db)):
    """MoMo IPN receiver: HMAC-SHA256 verified, idempotent; the only path that marks orders PAID."""
    await PaymentService.handle_ipn(db, payload)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/payments/momo/order-status/{order_id}", response_model=OrderStatusResponse, status_code=status.HTTP_200_OK)
async def check_order_status(
    order_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    """Poll the caller's own order status for the payment dialog."""
    return await PaymentService.get_order_status(db, current_user.id, order_id)


@router.get("/wallet/", response_model=UserWalletStateResponse)
async def get_user_wallet_state(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    """Return available balance, escrow locked balance, and transaction ledger for the current user."""
    return await PaymentService.get_wallet(db, str(current_user.id))


@router.get("/wallet/balance", response_model=UserWalletStateResponse)
async def get_user_wallet_balance(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_read_db),
):
    """Mobile Wallet balance & ledger summary endpoint (BEL-225 parity)."""
    return await PaymentService.get_wallet(db, str(current_user.id))


@router.post("/wallet/topup", response_model=MomoCreatePaymentResponse, status_code=status.HTTP_201_CREATED)
async def topup_user_wallet(
    payload: WalletTopupRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a MoMo top-up; the balance is credited only when MoMo's signed IPN confirms payment."""
    return await PaymentService.topup_wallet(db, str(current_user.id), payload)


@router.post("/wallet/pay", response_model=UserWalletStateResponse)
async def pay_with_user_wallet(
    payload: WalletPayRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deduct available wallet balance for Micro-Pass or Expert Escrow Lock."""
    return await PaymentService.pay_with_wallet(db, str(current_user.id), payload)
