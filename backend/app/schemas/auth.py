from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    tenant_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    tenant_id: str
    email: str
    name: Optional[str] = None
    role: str


class UserResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    name: Optional[str] = None
    role: str
    status: str

    model_config = {"from_attributes": True}
