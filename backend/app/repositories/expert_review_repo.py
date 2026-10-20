"""Backward-compatible re-export shim for ExpertReviewRepository (moved to app.modules.expert_review)."""

from app.modules.expert_review.repository import ExpertReviewRepository

__all__ = ["ExpertReviewRepository"]
