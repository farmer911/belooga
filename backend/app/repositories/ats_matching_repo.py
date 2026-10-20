"""Backward-compatible re-export shim for ATSMatchingRepository (moved to app.modules.ats_matching)."""

from app.modules.ats_matching.repository import ATSMatchingRepository

__all__ = ["ATSMatchingRepository"]
