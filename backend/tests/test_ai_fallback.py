import asyncio
import unittest
from pathlib import Path

from app.ai.fallback_provider import FallbackAIProvider
from app.ai.models import AIRequest, ProviderOutput
from app.ai.provider import (
    AIConfigurationError,
    AIUnavailableError,
    ProviderError,
    ProviderErrorCategory,
)
from app.ai.service import AIService
from app.services.study_ai_provider import DeterministicStudyAiProvider


class MemoryLogger:
    def __init__(self):
        self.messages = []

    def info(self, message):
        self.messages.append(message)


class FakeProvider:
    name = "fake"

    def __init__(self, outcomes):
        self.outcomes = {model: list(values) for model, values in outcomes.items()}
        self.calls = []

    async def generate(self, request, model_id):
        self.calls.append((request, model_id))
        outcome = self.outcomes[model_id].pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return ProviderOutput(content=outcome)


def request():
    return AIRequest(
        prompt="Answer from evidence",
        student_id="verified-student",
        authorized_context="private authorized context",
        safety_instructions="Never invent academic facts.",
        language_preference="English",
    )


def provider(outcomes, retries=1, logger=None):
    fake = FakeProvider(outcomes)
    fallback = FallbackAIProvider(fake, ["primary", "fallback-one", "fallback-two"], 1, retries, 0, logger or MemoryLogger())
    return fake, fallback


class FallbackProviderTests(unittest.TestCase):
    def test_primary_success(self):
        fake, fallback = provider({"primary": ["ok"], "fallback-one": [], "fallback-two": []})
        result = asyncio.run(fallback.generate(request()))
        self.assertEqual(result.content, "ok")
        self.assertFalse(result.fallback_used)
        self.assertEqual([model for _, model in fake.calls], ["primary"])

    def test_primary_timeout_then_first_fallback_succeeds(self):
        timeout = ProviderError(ProviderErrorCategory.TIMEOUT)
        fake, fallback = provider({"primary": [timeout, timeout], "fallback-one": ["ok"], "fallback-two": []})
        result = asyncio.run(fallback.generate(request()))
        self.assertTrue(result.fallback_used)
        self.assertEqual(result.model_used, "fallback-one")
        self.assertEqual([model for _, model in fake.calls], ["primary", "primary", "fallback-one"])

    def test_primary_rate_limit_then_first_fallback_succeeds(self):
        limited = ProviderError(ProviderErrorCategory.RATE_LIMIT)
        fake, fallback = provider({"primary": [limited, limited], "fallback-one": ["ok"], "fallback-two": []})
        result = asyncio.run(fallback.generate(request()))
        self.assertEqual(result.model_used, "fallback-one")
        self.assertEqual(len(fake.calls), 3)

    def test_final_fallback_succeeds(self):
        unavailable = ProviderError(ProviderErrorCategory.UNAVAILABLE)
        fake, fallback = provider({
            "primary": [unavailable, unavailable],
            "fallback-one": [unavailable, unavailable],
            "fallback-two": ["ok"],
        })
        result = asyncio.run(fallback.generate(request()))
        self.assertEqual(result.model_used, "fallback-two")
        self.assertTrue(result.fallback_used)
        self.assertEqual(len(fake.calls), 5)

    def test_all_models_fail_with_controlled_response(self):
        unavailable = ProviderError(ProviderErrorCategory.UNAVAILABLE)
        _, fallback = provider({model: [unavailable, unavailable] for model in ("primary", "fallback-one", "fallback-two")})
        with self.assertRaisesRegex(AIUnavailableError, "^AI temporarily unavailable$"):
            asyncio.run(fallback.generate(request()))

    def test_invalid_key_and_invalid_model_do_not_fallback(self):
        for category in (ProviderErrorCategory.INVALID_API_KEY, ProviderErrorCategory.INVALID_MODEL):
            with self.subTest(category=category):
                fake, fallback = provider({"primary": [ProviderError(category)], "fallback-one": [], "fallback-two": []})
                with self.assertRaises(AIConfigurationError):
                    asyncio.run(AIService(fallback).generate(request()))
                self.assertEqual(len(fake.calls), 1)

    def test_unsupported_request_does_not_fallback(self):
        fake, fallback = provider({"primary": [ProviderError(ProviderErrorCategory.UNSUPPORTED)], "fallback-one": [], "fallback-two": []})
        with self.assertRaises(ProviderError):
            asyncio.run(fallback.generate(request()))
        self.assertEqual(len(fake.calls), 1)

    def test_fallback_receives_identical_authorized_context(self):
        timeout = ProviderError(ProviderErrorCategory.TIMEOUT)
        original = request()
        fake, fallback = provider({"primary": [timeout, timeout], "fallback-one": ["ok"], "fallback-two": []})
        asyncio.run(fallback.generate(original))
        self.assertTrue(all(call_request is original for call_request, _ in fake.calls))
        self.assertTrue(all(call_request.student_id == "verified-student" for call_request, _ in fake.calls))
        self.assertTrue(all(call_request.authorized_context == "private authorized context" for call_request, _ in fake.calls))

    def test_unsupported_study_question_is_evidence_locked(self):
        result = asyncio.run(DeterministicStudyAiProvider().generate("formulas", [{"id": "c1", "text": "Plants use light."}]))
        self.assertEqual(result["answer"], "Not available in your uploaded material.")
        self.assertEqual(result["citationChunkIds"], [])

    def test_secret_never_appears_in_logs_or_controlled_error(self):
        secret = "never-print-this-key"
        logger = MemoryLogger()
        failure = ProviderError(ProviderErrorCategory.UNAVAILABLE)
        failure.__cause__ = RuntimeError(secret)
        _, fallback = provider({model: [failure, failure] for model in ("primary", "fallback-one", "fallback-two")}, logger=logger)
        with self.assertRaises(AIUnavailableError) as caught:
            asyncio.run(fallback.generate(request()))
        output = "\n".join(logger.messages) + str(caught.exception)
        self.assertNotIn(secret, output)

    def test_frontend_contains_no_gemini_key_or_model_ids(self):
        frontend = Path(__file__).parents[2] / "src"
        source = "\n".join(path.read_text(encoding="utf-8") for suffix in ("*.ts", "*.tsx") for path in frontend.rglob(suffix))
        self.assertNotIn("GEMINI_API_KEY", source)
        self.assertNotIn("gemini-", source.lower())


if __name__ == "__main__":
    unittest.main()
