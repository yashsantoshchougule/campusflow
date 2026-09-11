import axios from "axios";
import { OPENAI_API_KEY, OPENAI_MODEL } from "../config/env.js";

export class OpenAIProvider {
  async generateJson({ system, messages, schema, temperature }) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: OPENAI_MODEL,
          messages: [{ role: "system", content: system }, ...messages],
          response_format: { type: "json_object" },
          temperature,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(response);
      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);

      // Validate against schema if provided
      if (schema) {
        this.validateSchema(parsed, schema);
      }

      return parsed;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        console.error(
          `OpenAI API Error [${status}]:`,
          JSON.stringify(data, null, 2),
        );

        // 把详细信息挂到 error 上，让上层 provider.js 能读到
        error.status = status;
        error.errorCode = data?.error?.code;
        error.errorType = data?.error?.type;

        // 特别标记 credit 不足，方便快速识别
        if (data?.error?.code === "insufficient_quota") {
          console.error(
            "❌ OpenAI credit exhausted. Please top up at https://platform.openai.com/settings/billing",
          );
        }
      } else if (error.request) {
        // 请求发出去了但没收到响应（网络问题）
        console.error("Network error - no response received:", error.message);
      } else {
        // 其他错误（如 JSON parse 失败）
        console.error("Unexpected error:", error.message);
      }

      throw error;
    }
  }

  validateSchema(data, schema) {
    // Basic validation - could use ajv for more robust validation
    for (const key of schema.required || []) {
      if (!(key in data)) {
        throw new Error(`Missing required field: ${key}`);
      }
    }
  }
}
