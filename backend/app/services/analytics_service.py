"""Backward-compatible re-export shim for AnalyticsService (moved to app.modules.analytics)."""

from app.modules.analytics.service import AnalyticsService

__all__ = ["AnalyticsService"]
