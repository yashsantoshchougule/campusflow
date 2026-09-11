import axios from "axios";
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from "../config/env.js";

export class AnthropicProvider {
  async generateJson({ system, messages, schema, temperature }) {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        system,
        messages,
        temperature,
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      },
    );

    const content = response.data.content[0].text;

    // Extract JSON from markdown code blocks if present
    let jsonStr = content;
    const match = content.match(/```json\n([\s\S]*?)\n```/);
    if (match) {
      jsonStr = match[1];
    }

    const parsed = JSON.parse(jsonStr);

    // Validate against schema if provided
    if (schema) {
      this.validateSchema(parsed, schema);
    }

    return parsed;
  }

  validateSchema(data, schema) {
    for (const key of schema.required || []) {
      if (!(key in data)) {
        throw new Error(`Missing required field: ${key}`);
      }
    }
  }
}
