from typing import List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CatalogItemResponse(BaseModel):
    """Generic catalog taxonomy item (skill, company, school, or location)."""

    model_config = ConfigDict(from_attributes=True)

    id: Optional[Union[UUID, str]] = None
    name: str
    logo_url: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


class SuggestionResponse(BaseModel):
    """Autosuggestion search response."""

    query: Optional[str] = None
    items: List[CatalogItemResponse] = []
