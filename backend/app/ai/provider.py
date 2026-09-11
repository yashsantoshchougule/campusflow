from enum import Enum
from typing import Protocol

from app.ai.models import AIRequest, ProviderOutput


class ProviderErrorCategory(str, Enum):
    TIMEOUT = "timeout"
    NETWORK = "network"
    RATE_LIMIT = "rate_limit"
    INTERNAL = "internal"
    BAD_GATEWAY = "bad_gateway"
    UNAVAILABLE = "unavailable"
    GATEWAY_TIMEOUT = "gateway_timeout"
    OUTAGE = "temporary_outage"
    INVALID_REQUEST = "invalid_request"
    INVALID_API_KEY = "invalid_api_key"
    PERMISSION_DENIED = "permission_denied"
    INVALID_MODEL = "invalid_model"
    UNSUPPORTED = "unsupported"
    BLOCKED = "blocked"
    UNAUTHORIZED = "unauthorized"
    UNKNOWN = "unknown"


RETRYABLE_CATEGORIES = {
    ProviderErrorCategory.TIMEOUT,
    ProviderErrorCategory.NETWORK,
    ProviderErrorCategory.RATE_LIMIT,
    ProviderErrorCategory.INTERNAL,
    ProviderErrorCategory.BAD_GATEWAY,
    ProviderErrorCategory.UNAVAILABLE,
    ProviderErrorCategory.GATEWAY_TIMEOUT,
    ProviderErrorCategory.OUTAGE,
}


class ProviderError(RuntimeError):
    def __init__(self, category: ProviderErrorCategory):
        super().__init__(category.value)
        self.category = category

    @property
    def retryable(self) -> bool:
        return self.category in RETRYABLE_CATEGORIES


class AIConfigurationError(RuntimeError):
    pass


class AIInputError(RuntimeError):
    pass


class AIUnavailableError(RuntimeError):
    pass


class AIProvider(Protocol):
    name: str

    async def generate(self, request: AIRequest, model_id: str) -> ProviderOutput: ...
