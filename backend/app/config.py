from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = "https://qddaeftinnxknlrhpirw.supabase.co"
    supabase_publishable_key: str = "sb_publishable_5sneEUn99vu3iGgOEWC3Vw_CN9YN2MZ"
    
    # AI Models
    gemini_api_key: Optional[str] = None
    ai_provider: str = ""
    ai_model_primary: Optional[str] = None
    ai_model_fallbacks: str = ""
    ai_request_timeout_seconds: float = 45
    ai_max_retries_per_model: int = 1
    longcat_api_key: Optional[str] = None
    github_token: Optional[str] = None
    mistral_api_key: Optional[str] = None
    
    # Server
    port: int = 8003
    host: str = "0.0.0.0"
    frontend_url: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def ai_model_fallback_list(self) -> list[str]:
        return [model.strip() for model in self.ai_model_fallbacks.split(",") if model.strip()]


settings = Settings()
