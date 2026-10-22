"""Repository Layer for Domain 13: MoMo Payments & Escrow (Vertical Module: payments)."""

from datetime import datetime
from typing import Any, Dict, Optional
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

ORDERS_DB: Dict[str, Dict[str, Any]] = {}


class PaymentRepository:
    """Repository encapsulating MoMo payment order state, PostgreSQL sync, and idempotent transitions."""

    @staticmethod
    def create_order(
        order_id: str,
        amount: float,
        package_type: str,
        review_order_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        record = {
            "order_id": order_id,
            "amount": amount,
            "package_type": package_type,
            "review_order_id": review_order_id,
            "status": "PENDING",
            "created_at": datetime.now().isoformat(),
            "trans_id": None,
        }
        ORDERS_DB[order_id] = record
        return record

    @staticmethod
    async def persist_order_to_db(
        db: AsyncSession,
        order_id: str,
        amount: float,
        package_type: str,
        review_order_id: Optional[str] = None,
    ) -> None:
        if review_order_id:
            try:
                rid = uuid.UUID(str(review_order_id))
                await db.execute(
                    text("""
                        UPDATE cv_review_orders
                        SET payment_reference = :oid, updated_at = NOW()
                        WHERE id = :rid
                    """),
                    {"oid": order_id, "rid": rid},
                )
                await db.commit()
            except ValueError:
                return
        else:
            _ = (amount, package_type)

    @staticmethod
    def get_order(order_id: str) -> Optional[Dict[str, Any]]:
        return ORDERS_DB.get(order_id)

    @staticmethod
    async def get_order_with_db(order_id: str, db: Optional[AsyncSession] = None) -> Optional[Dict[str, Any]]:
        order = ORDERS_DB.get(order_id)
        if order:
            return order
        if db is None:
            return None
        res = await db.execute(
            text("""
                SELECT id, order_status, amount_paid_cents, payment_reference
                FROM cv_review_orders
                WHERE payment_reference = :oid OR payment_reference LIKE :prefix
                LIMIT 1
            """),
            {"oid": order_id, "prefix": f"{order_id}:%"},
        )
        row = res.mappings().first()
        if not row:
            return None
        is_paid = row["order_status"] in ("paid", "in_review", "completed")
        record = {
            "order_id": order_id,
            "amount": float(row["amount_paid_cents"] or 0),
            "package_type": "EXPERT_REVIEW",
            "review_order_id": str(row["id"]),
            "status": "PAID" if is_paid else "PENDING",
            "created_at": datetime.now().isoformat(),
            "trans_id": None,
        }
        ORDERS_DB[order_id] = record
        return record

    @staticmethod
    def mark_order_paid(order_id: str, trans_id: Optional[str]) -> Optional[Dict[str, Any]]:
        order = ORDERS_DB.get(order_id)
        if not order:
            return None
        order["status"] = "PAID"
        order["trans_id"] = trans_id
        order["paid_at"] = datetime.now().isoformat()
        return order

    @staticmethod
    async def sync_paid_order_to_db(db: AsyncSession, order_id: str, trans_id: Optional[str]) -> None:
        """Persist MoMo IPN settlement to any linked cv_review_orders record in PostgreSQL."""
        order = ORDERS_DB.get(order_id) or {}
        raw_rid = str(order.get("review_order_id") or "")
        pref = f"{order_id}:{trans_id or 'momo'}"
        if len(raw_rid) == 36:
            try:
                rid: Optional[uuid.UUID] = uuid.UUID(raw_rid)
            except ValueError:
                rid = None
            if rid is not None:
                await db.execute(
                    text("""
                        UPDATE cv_review_orders
                        SET order_status = 'paid',
                            payment_reference = :pref,
                            updated_at = NOW()
                        WHERE (id = :rid OR payment_reference = :oid) AND order_status = 'pending_payment'
                    """),
                    {"rid": rid, "oid": order_id, "pref": pref},
                )
                await db.commit()
                return
        await db.execute(
            text("""
                UPDATE cv_review_orders
                SET order_status = 'paid',
                    payment_reference = :pref,
                    updated_at = NOW()
                WHERE payment_reference = :oid AND order_status = 'pending_payment'
            """),
            {"oid": order_id, "pref": pref},
        )
        await db.commit()
