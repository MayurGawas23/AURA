import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Centralized Application Configuration for AURA Multi-Agent Platform."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General App Settings
    APP_NAME: str = "AURA - Autonomous Universal Reasoning Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Model Defaults
    DEFAULT_MODEL: str = "mistral-small-2506"
    VISION_MODEL: str = "pixtral-12b-2409"
    TEMPERATURE: float = 0.0

    # API Keys
    MISTRAL_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    TAVILY_API_KEY: str = ""

    # Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    MAX_FILE_SIZE_MB: int = 25

    def create_dirs(self) -> None:
        """Ensures necessary operational directories exist."""
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.create_dirs()
