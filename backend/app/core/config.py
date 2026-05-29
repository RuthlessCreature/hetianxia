from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = Field(default="高纳AI", validation_alias="HTX_APP_NAME")
    COMPANY_NAME: str = Field(default="高纳科技", validation_alias="HTX_COMPANY_NAME")
    PLATFORM_NAME: str = Field(default="工业视觉平台", validation_alias="HTX_PLATFORM_NAME")
    THEME: str = Field(default="light", validation_alias="HTX_THEME")
    LAYOUT: str = Field(default="sidebar", validation_alias="HTX_LAYOUT")
    DATABASE_URL: str = Field(default="sqlite:///./storage/hetianxia.db", validation_alias="HTX_DATABASE_URL")
    SECRET_KEY: str = Field(default="change-me-to-a-random-secret-key", validation_alias="HTX_SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", validation_alias="HTX_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, validation_alias="HTX_ACCESS_TOKEN_EXPIRE_MINUTES")
    UPLOAD_DIR: str = Field(default="./storage/uploads", validation_alias="HTX_UPLOAD_DIR")
    THUMBNAIL_DIR: str = Field(default="./storage/thumbnails", validation_alias="HTX_THUMBNAIL_DIR")

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
