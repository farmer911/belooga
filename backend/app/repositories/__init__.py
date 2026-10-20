"""Repositories package shim (Vertical module repositories live in `app.modules.<domain>.repository`)."""

from importlib import import_module
from typing import Any

_LAZY_MAP = {
    "IdentityRepository": ("app.modules.auth.repository", "IdentityRepository"),
    "ProfileRepository": ("app.modules.profile.repository", "ProfileRepository"),
    "TimelineRepository": ("app.modules.timeline.repository", "TimelineRepository"),
    "MediaRepository": ("app.modules.media.repository", "MediaRepository"),
    "CatalogsRepository": ("app.modules.catalogs.repository", "CatalogsRepository"),
    "SearchRepository": ("app.modules.search.repository", "SearchRepository"),
    "CmsRepository": ("app.modules.cms.repository", "CmsRepository"),
}

__all__ = list(_LAZY_MAP.keys())


def __getattr__(name: str) -> Any:
    if name in _LAZY_MAP:
        mod_path, attr = _LAZY_MAP[name]
        return getattr(import_module(mod_path), attr)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
