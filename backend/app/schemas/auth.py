from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RegisterShelterUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    shelter_id: int
