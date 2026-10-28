"""Backward-compatible re-export shim for PaymentService (moved to app.modules.payments)."""

from app.modules.payments.service import MOMO_SECRET_KEY, PaymentService

__all__ = ["PaymentService", "MOMO_SECRET_KEY"]
