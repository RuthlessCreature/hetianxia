import uuid
from typing import Optional

from sqlmodel import Session, select

from app.core.security import create_access_token, hash_password, verify_password
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister


class AuthService:
    @staticmethod
    def register(db: Session, data: UserRegister) -> TokenResponse:
        existing = db.exec(select(User).where(User.email == data.email)).first()
        if existing:
            raise ValueError("Email already registered")

        tenant_id = f"t_{uuid.uuid4().hex[:12]}"
        tenant = Tenant(
            id=tenant_id,
            name=data.tenant_name or f"{data.name}的团队",
            plan="trial",
        )
        db.add(tenant)

        user_id = f"u_{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id,
            tenant_id=tenant_id,
            email=data.email,
            name=data.name,
            password_hash=hash_password(data.password),
            role="owner",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(data={"sub": user.id, "tenant_id": user.tenant_id})
        return TokenResponse(
            access_token=token,
            user_id=user.id,
            tenant_id=user.tenant_id,
            email=user.email,
            name=user.name,
            role=user.role,
        )

    @staticmethod
    def login(db: Session, data: UserLogin) -> TokenResponse:
        user = db.exec(select(User).where(User.email == data.email)).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise ValueError("Invalid email or password")
        if user.status != "active":
            raise ValueError("Account is disabled")

        token = create_access_token(data={"sub": user.id, "tenant_id": user.tenant_id})
        return TokenResponse(
            access_token=token,
            user_id=user.id,
            tenant_id=user.tenant_id,
            email=user.email,
            name=user.name,
            role=user.role,
        )

    @staticmethod
    def get_me(db: Session, user_id: str) -> Optional[User]:
        return db.get(User, user_id)
