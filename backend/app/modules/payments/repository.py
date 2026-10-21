"""Repository Layer for Domain 13: MoMo Payments & Escrow (Vertical Module: payments)."""

from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

ORDERS_DB: Dict[str, Dict[str, Any]] = {}


class PaymentRepository:
    """Repository encapsulating MoMo payment order state, PostgreSQL sync, and idempotent transitions."""

    @staticmethod
    def create_order(order_id: str, amount: float, package_type: str) -> Dict[str, Any]:
        record = {
            "order_id": order_id,
            "amount": amount,
            "package_type": package_type,
            "status": "PENDING",
            "created_at": datetime.now().isoformat(),
            "trans_id": None,
        }
        ORDERS_DB[order_id] = record
        return record

    @staticmethod
    def get_order(order_id: str) -> Optional[Dict[str, Any]]:
        return ORDERS_DB.get(order_id)

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
        await db.execute(
            text("""
                UPDATE cv_review_orders
                SET order_status = 'paid',
                    payment_reference = :pref,
                    updated_at = NOW()
                WHERE payment_reference = :oid AND order_status = 'pending_payment'
            """),
            {"oid": order_id, "pref": f"{order_id}:{trans_id or 'momo'}"},
        )
        await db.commit()
