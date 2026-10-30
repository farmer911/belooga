"""SQLAlchemy 2.0 ORM Models for Domain 13: Wallet ledger & MoMo payment orders."""

from datetime import datetime
from typing import Optional
import uuid

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Wallet(Base):
    """One balance row per identity; mutated only under SELECT ... FOR UPDATE."""

    __tablename__ = "wallets"

    identity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="CASCADE"), primary_key=True
    )
    available_balance_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False, server_default=text("0"))
    escrow_locked_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False, server_default=text("0"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("available_balance_vnd >= 0", name="wallets_available_balance_vnd_check"),
        CheckConstraint("escrow_locked_vnd >= 0", name="wallets_escrow_locked_vnd_check"),
    )


class WalletTransaction(Base):
    """Append-only ledger entry."""

    __tablename__ = "wallet_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    identity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="CASCADE"), nullable=False
    )
    tx_type: Mapped[str] = mapped_column(String(32), nullable=False)
    amount_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    reference_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("amount_vnd > 0", name="wallet_transactions_amount_vnd_check"),
        Index("idx_wallet_transactions_identity_created", "identity_id", created_at.desc()),
    )


class PaymentOrder(Base):
    """MoMo payment order; becomes PAID only through a signature-verified IPN."""

    __tablename__ = "payment_orders"

    order_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    identity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("identities.id", ondelete="CASCADE"), nullable=False
    )
    package_type: Mapped[str] = mapped_column(String(32), nullable=False)
    amount_vnd: Mapped[int] = mapped_column(BigInteger, nullable=False)
    review_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cv_review_orders.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, server_default=text("'PENDING'"))
    trans_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("amount_vnd > 0", name="payment_orders_amount_vnd_check"),
        Index("idx_payment_orders_identity_created", "identity_id", created_at.desc()),
    )
