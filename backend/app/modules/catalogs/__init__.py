"""Public Facade for the Master Catalogs Vertical Slice Module (`app.modules.catalogs`)."""

from app.modules.catalogs.companies_service import CompaniesService
from app.modules.catalogs.service import CatalogsService

__all__ = ["CatalogsService", "CompaniesService"]
