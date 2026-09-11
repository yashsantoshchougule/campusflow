import asyncio
from pathlib import Path

from app.ai.models import AIRequest, ProviderOutput
from app.ai.provider import AIProvider, ProviderError, ProviderErrorCategory


def classify_gemini_error(error: Exception) -> ProviderErrorCategory:
    if isinstance(error, (asyncio.TimeoutError, TimeoutError)):
        return ProviderErrorCategory.TIMEOUT
    if isinstance(error, (ConnectionError, OSError)):
        return ProviderErrorCategory.NETWORK

    status = getattr(error, "status_code", None) or getattr(error, "code", None)
    if callable(status):
        status = status()
    try:
        status = int(status)
    except (TypeError, ValueError):
        status = None

    by_status = {
        400: ProviderErrorCategory.INVALID_REQUEST,
        401: ProviderErrorCategory.INVALID_API_KEY,
        403: ProviderErrorCategory.PERMISSION_DENIED,
        404: ProviderErrorCategory.INVALID_MODEL,
        429: ProviderErrorCategory.RATE_LIMIT,
        500: ProviderErrorCategory.INTERNAL,
        502: ProviderErrorCategory.BAD_GATEWAY,
        503: ProviderErrorCategory.UNAVAILABLE,
        504: ProviderErrorCategory.GATEWAY_TIMEOUT,
    }
    if status in by_status:
        return by_status[status]

    message = f"{type(error).__name__} {error}".lower()
    checks = (
        (("api key", "unauthenticated"), ProviderErrorCategory.INVALID_API_KEY),
        (("permission denied", "forbidden"), ProviderErrorCategory.PERMISSION_DENIED),
        (("not found", "unknown model"), ProviderErrorCategory.INVALID_MODEL),
        (("resource exhausted", "rate limit", "too many requests"), ProviderErrorCategory.RATE_LIMIT),
        (("deadline", "timed out", "timeout"), ProviderErrorCategory.TIMEOUT),
        (("connection", "network", "dns"), ProviderErrorCategory.NETWORK),
        (("blocked", "safety"), ProviderErrorCategory.BLOCKED),
        (("unsupported",), ProviderErrorCategory.UNSUPPORTED),
        (("unavailable", "overloaded", "temporary outage"), ProviderErrorCategory.UNAVAILABLE),
        (("internal",), ProviderErrorCategory.INTERNAL),
        (("invalid argument", "bad request"), ProviderErrorCategory.INVALID_REQUEST),
    )
    return next((category for words, category in checks if any(word in message for word in words)), ProviderErrorCategory.UNKNOWN)


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self, api_key: str | None):
        self.api_key = api_key

    async def generate(self, request: AIRequest, model_id: str) -> ProviderOutput:
        if not self.api_key:
            raise ProviderError(ProviderErrorCategory.INVALID_API_KEY)

        uploaded = []
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            for file_path in request.file_paths:
                if not Path(file_path).is_file():
                    raise ProviderError(ProviderErrorCategory.UNSUPPORTED)
                uploaded.append(await asyncio.to_thread(genai.upload_file, file_path))

            response = await genai.GenerativeModel(model_id).generate_content_async([request.provider_prompt(), *uploaded])
            content = response.text if response else ""
            if not content or not content.strip():
                raise ProviderError(ProviderErrorCategory.BLOCKED)
            return ProviderOutput(content=content.strip(), source_citations=request.source_citations)
        except ProviderError:
            raise
        except Exception as error:
            raise ProviderError(classify_gemini_error(error)) from error
        finally:
            for uploaded_file in uploaded:
                try:
                    await asyncio.to_thread(genai.delete_file, uploaded_file.name)
                except Exception:
                    pass
