"""Public Facade for the MoMo Payments & Escrow Vertical Slice Module (`app.modules.payments`)."""

from app.modules.payments.service import MOMO_SECRET_KEY, PaymentService

__all__ = ["PaymentService", "MOMO_SECRET_KEY"]
