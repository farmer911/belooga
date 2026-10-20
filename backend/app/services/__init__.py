"""Services package shim (Vertical modules live in `app.modules.<domain>`)."""

from importlib import import_module
from typing import Any

_LAZY_MAP = {
    "AuthService": ("app.modules.auth.service", "AuthService"),
    "ProfileService": ("app.modules.profile.service", "ProfileService"),
    "TimelineService": ("app.modules.timeline.service", "TimelineService"),
    "MediaService": ("app.modules.media.service", "MediaService"),
    "CatalogsService": ("app.modules.catalogs.service", "CatalogsService"),
    "SearchService": ("app.modules.search.service", "SearchService"),
    "CmsService": ("app.modules.cms.service", "CmsService"),
    "generate_pdf_resume_async": ("app.services.pdf_generator", "generate_pdf_resume_async"),
}

__all__ = list(_LAZY_MAP.keys())


def __getattr__(name: str) -> Any:
    if name in _LAZY_MAP:
        mod_path, attr = _LAZY_MAP[name]
        return getattr(import_module(mod_path), attr)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
