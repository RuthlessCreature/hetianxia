from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./storage/hetianxia.db"
    SECRET_KEY: str = "change-me-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "./storage/uploads"
    THUMBNAIL_DIR: str = "./storage/thumbnails"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
