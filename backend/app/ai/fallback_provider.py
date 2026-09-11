import asyncio
import logging
from time import perf_counter

from app.ai.models import AIRequest, AIResponse
from app.ai.provider import AIProvider, AIUnavailableError, ProviderError, ProviderErrorCategory


class FallbackAIProvider:
    def __init__(
        self,
        provider: AIProvider,
        model_ids: list[str],
        timeout_seconds: float,
        max_retries_per_model: int,
        backoff_seconds: float = 0.25,
        logger=None,
    ):
        self.provider = provider
        self.model_ids = model_ids
        self.timeout_seconds = timeout_seconds
        self.max_retries_per_model = max_retries_per_model
        self.backoff_seconds = backoff_seconds
        self.logger = logger or logging.getLogger("AI_FALLBACK")

    async def generate(self, request: AIRequest) -> AIResponse:
        for model_index, model_id in enumerate(self.model_ids):
            for attempt in range(self.max_retries_per_model + 1):
                started = perf_counter()
                category: ProviderErrorCategory | None = None
                try:
                    output = await asyncio.wait_for(self.provider.generate(request, model_id), self.timeout_seconds)
                    latency_ms = round((perf_counter() - started) * 1000)
                    self._log(request.request_id, model_id, "success", "none", latency_ms, model_index > 0)
                    return AIResponse(
                        content=output.content,
                        model_used=model_id,
                        fallback_used=model_index > 0,
                        source_citations=output.source_citations,
                    )
                except asyncio.TimeoutError:
                    category = ProviderErrorCategory.TIMEOUT
                except ProviderError as error:
                    category = error.category

                latency_ms = round((perf_counter() - started) * 1000)
                self._log(request.request_id, model_id, "failure", category.value, latency_ms, model_index > 0)
                if category not in {
                    ProviderErrorCategory.TIMEOUT,
                    ProviderErrorCategory.NETWORK,
                    ProviderErrorCategory.RATE_LIMIT,
                    ProviderErrorCategory.INTERNAL,
                    ProviderErrorCategory.BAD_GATEWAY,
                    ProviderErrorCategory.UNAVAILABLE,
                    ProviderErrorCategory.GATEWAY_TIMEOUT,
                    ProviderErrorCategory.OUTAGE,
                }:
                    raise ProviderError(category)
                if attempt < self.max_retries_per_model:
                    await asyncio.sleep(self.backoff_seconds * (2**attempt))

        raise AIUnavailableError("AI temporarily unavailable")

    def _log(self, request_id: str, model_id: str, status: str, category: str, latency_ms: int, fallback_used: bool) -> None:
        self.logger.info(
            f"request_id={request_id} provider={self.provider.name} model={model_id} "
            f"status={status} category={category} latency_ms={latency_ms} fallback_used={str(fallback_used).lower()}"
        )
