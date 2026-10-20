"""Backward-compatible re-export shim for PaymentService (moved to app.modules.payments)."""

from app.modules.payments.service import MOMO_SECRET_KEY, ORDERS_DB, PaymentService

__all__ = ["PaymentService", "ORDERS_DB", "MOMO_SECRET_KEY"]
