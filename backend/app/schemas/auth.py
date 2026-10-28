from pydantic import BaseModel, ConfigDict, EmailStr, Field
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
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserProfileDTO


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class CheckAvailabilityResponse(BaseModel):
    exists: bool
    available: bool


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class OAuthCallbackRequest(BaseModel):
    provider: str = Field("google", min_length=2, max_length=32)
    code: str = Field(..., min_length=4, max_length=2048)
    redirect_uri: str = Field(..., min_length=8, max_length=512)
    code_verifier: Optional[str] = Field(None, min_length=43, max_length=128)


class EmailVerificationRequestResponse(BaseModel):
    message: str
    verification_token: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=8)


class VerifyEmailResponse(BaseModel):
    message: str
    verified: bool
