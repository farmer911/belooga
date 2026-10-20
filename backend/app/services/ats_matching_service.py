"""Backward-compatible re-export shim for ATSMatchingService (moved to app.modules.ats_matching)."""

from app.modules.ats_matching.service import ATSMatchingService

__all__ = ["ATSMatchingService"]
