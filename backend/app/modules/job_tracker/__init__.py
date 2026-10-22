"""Public Facade for the Candidate Job Application Tracker Vertical Slice Module (`app.modules.job_tracker`)."""

from app.modules.job_tracker.service import JobTrackerService, VALID_STATUSES

__all__ = ["JobTrackerService", "VALID_STATUSES"]
