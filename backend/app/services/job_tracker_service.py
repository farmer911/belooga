"""Backward-compatible re-export shim for JobTrackerService (moved to app.modules.job_tracker)."""

from app.modules.job_tracker.service import JobTrackerService

__all__ = ["JobTrackerService"]
