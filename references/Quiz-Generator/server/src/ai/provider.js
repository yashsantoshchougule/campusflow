import { AI_PROVIDER } from "../config/env.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";

let provider;

if (AI_PROVIDER === "openai") {
  provider = new OpenAIProvider();
} else if (AI_PROVIDER === "anthropic") {
  provider = new AnthropicProvider();
} else {
  throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
}

// 从响应头中提取需要等待的时间
function extractRetryAfter(error) {
  // OpenAI 和 Anthropic 都会在响应头中返回 retry-after
  const retryAfter = error.response?.headers?.["retry-after"];
  if (retryAfter) {
    return parseFloat(retryAfter) * 1000; // 转成毫秒
  }

  // 如果没有 header，检查错误消息中是否有时间信息
  const match = error.message?.match(/try again in (\d+\.?\d*)s/i);
  if (match) {
    return parseFloat(match[1]) * 1000;
  }

  return null;
}

// 指数退避 + Jitter（抖动）防止多个请求同时重试
function calculateBackoff(attempt) {
  const baseDelay = 5000; // 基础等待 5 秒
  const maxDelay = 60000; // 最大等待 60 秒
  const exponential = baseDelay * Math.pow(2, attempt); // 指数增长
  const jitter = Math.random() * 2000; // 随机抖动 0-2 秒
  return Math.min(exponential + jitter, maxDelay);
}

export async function generateJson({
  system,
  messages,
  schema,
  temperature = 0.7,
  maxRetries = 5,
}) {
  // ✅ 初始化为 null，而不是 undefined
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await provider.generateJson({
        system,
        messages,
        schema,
        temperature,
      });
      return result; // ✅ 成功直接 return，不会走到下面的 throw
    } catch (error) {
      lastError = error;
      const status = error.response?.status;

      console.error(
        `Generation attempt ${attempt + 1} failed: ${error.message}`,
      );

      // 最后一次重试失败，直接抛出
      if (attempt === maxRetries - 1) {
        break; // ✅ 用 break 跳出循环，统一在下面处理
      }

      // credit 用完，不需要重试，直接退出
      if (error.errorCode === "insufficient_quota") {
        console.error("❌ Credit exhausted, stopping retries.");
        break; // ✅ 立刻退出，不浪费时间重试
      }

      let waitMs;

      if (status === 429) {
        const retryAfterMs = extractRetryAfter(error);
        waitMs = retryAfterMs || calculateBackoff(attempt);
        console.log(
          `Rate limited. Waiting ${(waitMs / 1000).toFixed(1)}s before retry...`,
        );
      } else if (status >= 500) {
        waitMs = calculateBackoff(attempt);
        console.log(
          `Server error ${status}. Waiting ${(waitMs / 1000).toFixed(1)}s...`,
        );
      } else {
        // 4xx 等其他错误不重试
        break; // ✅ 用 break，不用 throw，统一在下面处理
      }

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  // ✅ 统一在这里处理失败
  if (lastError) {
    throw lastError;
  }

  // ✅ 理论上不会走到这里，但加一个保底
  throw new Error("generateJson failed for unknown reason");
}
