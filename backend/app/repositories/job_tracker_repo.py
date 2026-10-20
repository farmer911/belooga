"""Backward-compatible re-export shim for JobTrackerRepository (moved to app.modules.job_tracker)."""

from app.modules.job_tracker.repository import JobTrackerRepository

__all__ = ["JobTrackerRepository"]
