from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)

from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserProfileDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    role: str = "candidate"
    avatar_url: Optional[str] = "/images/avatar.jpg"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileDTO

class CheckAvailabilityResponse(BaseModel):
    exists: bool
    available: bool
