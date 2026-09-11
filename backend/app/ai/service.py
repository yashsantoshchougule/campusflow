from app.ai.fallback_provider import FallbackAIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.models import AIRequest, AIResponse
from app.ai.provider import (
    AIConfigurationError,
    AIInputError,
    AIUnavailableError,
    ProviderError,
    ProviderErrorCategory,
)
from app.config import settings


class AIService:
    def __init__(self, provider: FallbackAIProvider):
        self.provider = provider

    async def generate(self, request: AIRequest) -> AIResponse:
        try:
            return await self.provider.generate(request)
        except ProviderError as error:
            if error.category in {
                ProviderErrorCategory.INVALID_API_KEY,
                ProviderErrorCategory.PERMISSION_DENIED,
                ProviderErrorCategory.INVALID_MODEL,
                ProviderErrorCategory.UNKNOWN,
            }:
                raise AIConfigurationError("AI backend configuration error") from error
            if error.category in {
                ProviderErrorCategory.INVALID_REQUEST,
                ProviderErrorCategory.UNSUPPORTED,
                ProviderErrorCategory.BLOCKED,
                ProviderErrorCategory.UNAUTHORIZED,
            }:
                raise AIInputError("AI request could not be processed") from error
            raise AIUnavailableError("AI temporarily unavailable") from error


def get_ai_service() -> AIService:
    models = [settings.ai_model_primary or "", *settings.ai_model_fallback_list]
    if settings.ai_provider.lower() != "gemini" or not settings.gemini_api_key:
        raise AIConfigurationError("AI backend configuration error")
    if len(models) != 3 or any(not model for model in models) or len(set(models)) != 3:
        raise AIConfigurationError("AI backend configuration error")
    if not 1 <= settings.ai_request_timeout_seconds <= 120 or not 0 <= settings.ai_max_retries_per_model <= 1:
        raise AIConfigurationError("AI backend configuration error")
    return AIService(
        FallbackAIProvider(
            GeminiProvider(settings.gemini_api_key),
            models,
            settings.ai_request_timeout_seconds,
            settings.ai_max_retries_per_model,
        )
    )
