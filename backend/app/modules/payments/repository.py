"""Repository Layer for Domain 13: MoMo payment orders, wallet balances and ledger (Vertical Module: payments).

Balance mutations run under `SELECT ... FOR UPDATE` on the wallet row so concurrent
payments cannot double-spend; callers commit once per business operation.
"""

from typing import Any, Optional
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- payment orders -------------------------------------------------
    async def create_order(
        self, order_id: str, identity_id: uuid.UUID, package_type: str, amount_vnd: int,
        review_order_id: Optional[uuid.UUID],
    ) -> None:
        await self.db.execute(
            text("""
                INSERT INTO payment_orders (order_id, identity_id, package_type, amount_vnd, review_order_id)
                VALUES (:oid, :uid, :pkg, :amt, :rid)
            """),
            {"oid": order_id, "uid": identity_id, "pkg": package_type, "amt": amount_vnd, "rid": review_order_id},
        )

    async def get_order(self, order_id: str, for_update: bool = False) -> Optional[dict[str, Any]]:
        lock = " FOR UPDATE" if for_update else ""
        row = (await self.db.execute(
            text(f"SELECT * FROM payment_orders WHERE order_id = :oid{lock}"), {"oid": order_id}
        )).mappings().first()
        return dict(row) if row else None

    async def set_order_status(self, order_id: str, new_status: str, trans_id: Optional[str]) -> None:
        await self.db.execute(
            text("""
                UPDATE payment_orders
                SET status = CAST(:st AS VARCHAR), trans_id = :tid,
                    paid_at = CASE WHEN CAST(:st AS VARCHAR) = 'PAID' THEN NOW() ELSE paid_at END
                WHERE order_id = :oid
            """),
            {"oid": order_id, "st": new_status, "tid": trans_id},
        )

    async def get_review_order(self, review_order_id: uuid.UUID, for_update: bool = False) -> Optional[dict[str, Any]]:
        lock = " FOR UPDATE" if for_update else ""
        row = (await self.db.execute(
            text(f"""
                SELECT id, candidate_identity_id, order_status, amount_paid_cents
                FROM cv_review_orders WHERE id = :rid{lock}
            """),
            {"rid": review_order_id},
        )).mappings().first()
        return dict(row) if row else None

    async def mark_review_order(self, review_order_id: uuid.UUID, new_status: str, payment_reference: str) -> None:
        await self.db.execute(
            text("""
                UPDATE cv_review_orders
                SET order_status = :st, payment_reference = :pref, updated_at = NOW()
                WHERE id = :rid AND order_status = 'pending_payment'
            """),
            {"rid": review_order_id, "st": new_status, "pref": payment_reference},
        )

    # ---- wallet ---------------------------------------------------------
    async def lock_wallet(self, identity_id: uuid.UUID) -> dict[str, Any]:
        await self.db.execute(
            text("INSERT INTO wallets (identity_id) VALUES (:uid) ON CONFLICT (identity_id) DO NOTHING"),
            {"uid": identity_id},
        )
        row = (await self.db.execute(
            text("SELECT * FROM wallets WHERE identity_id = :uid FOR UPDATE"), {"uid": identity_id}
        )).mappings().one()
        return dict(row)

    async def get_wallet(self, identity_id: uuid.UUID) -> dict[str, Any]:
        row = (await self.db.execute(
            text("SELECT available_balance_vnd, escrow_locked_vnd FROM wallets WHERE identity_id = :uid"),
            {"uid": identity_id},
        )).mappings().first()
        return dict(row) if row else {"available_balance_vnd": 0, "escrow_locked_vnd": 0}

    async def apply_wallet_delta(self, identity_id: uuid.UUID, available_delta: int, escrow_delta: int) -> None:
        await self.db.execute(
            text("""
                UPDATE wallets
                SET available_balance_vnd = available_balance_vnd + :a,
                    escrow_locked_vnd = escrow_locked_vnd + :e,
                    updated_at = NOW()
                WHERE identity_id = :uid
            """),
            {"uid": identity_id, "a": available_delta, "e": escrow_delta},
        )

    async def add_transaction(
        self, identity_id: uuid.UUID, tx_type: str, amount_vnd: int, description: str,
        reference_id: Optional[str], tx_status: str,
    ) -> None:
        await self.db.execute(
            text("""
                INSERT INTO wallet_transactions (identity_id, tx_type, amount_vnd, description, reference_id, status)
                VALUES (:uid, :tt, :amt, :d, :ref, :st)
            """),
            {"uid": identity_id, "tt": tx_type, "amt": amount_vnd, "d": description[:500],
             "ref": reference_id, "st": tx_status},
        )

    async def find_escrow_lock(self, identity_id: uuid.UUID, reference_id: str) -> Optional[dict[str, Any]]:
        row = (await self.db.execute(
            text("""
                SELECT id, amount_vnd FROM wallet_transactions
                WHERE identity_id = :uid AND reference_id = :ref
                  AND tx_type = 'EXPERT_ESCROW_LOCK' AND status = 'LOCKED_IN_ESCROW'
                ORDER BY created_at DESC LIMIT 1
            """),
            {"uid": identity_id, "ref": reference_id},
        )).mappings().first()
        return dict(row) if row else None

    async def set_transaction_status(self, tx_id: uuid.UUID, new_status: str) -> None:
        await self.db.execute(
            text("UPDATE wallet_transactions SET status = :st WHERE id = :id"), {"id": tx_id, "st": new_status}
        )

    async def list_transactions(self, identity_id: uuid.UUID, limit: int = 50) -> list[dict[str, Any]]:
        rows = (await self.db.execute(
            text("""
                SELECT id, tx_type, amount_vnd, description, reference_id, status, created_at
                FROM wallet_transactions WHERE identity_id = :uid
                ORDER BY created_at DESC LIMIT :lim
            """),
            {"uid": identity_id, "lim": limit},
        )).mappings().all()
        return [dict(r) for r in rows]
