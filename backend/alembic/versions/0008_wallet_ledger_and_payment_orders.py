"""Wallet ledger and MoMo payment orders as real tables.

Wallet balances used to live as JSON blobs in contact_inquiries rows named
'WALLET_STATE:<key>' and could be credited by an unauthenticated /wallet/topup
call, so none of those balances are backed by a payment. They are dropped, not
migrated: every wallet starts at 0 and is credited only by a verified MoMo IPN.

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-28 00:00:00.000000
"""

from typing import Sequence, Union
from alembic import op

revision: str = "0008"
down_revision: Union[str, Sequence[str], None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS wallets (
            identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
            available_balance_vnd BIGINT NOT NULL DEFAULT 0 CHECK (available_balance_vnd >= 0),
            escrow_locked_vnd BIGINT NOT NULL DEFAULT 0 CHECK (escrow_locked_vnd >= 0),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
            tx_type VARCHAR(32) NOT NULL CHECK (tx_type IN ('TOPUP', 'SYSTEM_PURCHASE', 'EXPERT_ESCROW_LOCK', 'EXPERT_ESCROW_RELEASE')),
            amount_vnd BIGINT NOT NULL CHECK (amount_vnd > 0),
            description VARCHAR(500) NOT NULL,
            reference_id VARCHAR(255),
            status VARCHAR(32) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_wallet_transactions_identity_created "
        "ON wallet_transactions(identity_id, created_at DESC)"
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS payment_orders (
            order_id VARCHAR(64) PRIMARY KEY,
            identity_id UUID NOT NULL REFERENCES identities(id) ON DELETE CASCADE,
            package_type VARCHAR(32) NOT NULL CHECK (package_type IN ('MICRO_PASS_29K', 'MICRO_PASS_59K', 'EXPERT_REVIEW', 'WALLET_TOPUP')),
            amount_vnd BIGINT NOT NULL CHECK (amount_vnd > 0),
            review_order_id UUID REFERENCES cv_review_orders(id) ON DELETE SET NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
            trans_id VARCHAR(64),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            paid_at TIMESTAMPTZ
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_payment_orders_identity_created "
        "ON payment_orders(identity_id, created_at DESC)"
    )
    op.execute("DELETE FROM contact_inquiries WHERE name LIKE 'WALLET_STATE:%'")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS payment_orders")
    op.execute("DROP TABLE IF EXISTS wallet_transactions")
    op.execute("DROP TABLE IF EXISTS wallets")
