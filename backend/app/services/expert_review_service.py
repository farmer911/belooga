"""Backward-compatible re-export shim for ExpertReviewService (moved to app.modules.expert_review)."""

from app.modules.expert_review.service import ExpertReviewService

__all__ = ["ExpertReviewService"]
