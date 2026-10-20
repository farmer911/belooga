"""Backward-compatible re-export shim for AnalyticsRepository (moved to app.modules.analytics)."""

from app.modules.analytics.repository import AnalyticsRepository

__all__ = ["AnalyticsRepository"]
