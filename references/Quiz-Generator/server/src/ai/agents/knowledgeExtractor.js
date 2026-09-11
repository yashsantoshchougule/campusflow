import { generateJson } from "../provider.js";
import { KNOWLEDGE_SCHEMA } from "../schemas.js";

export async function runKnowledgeExtractor(chunks, language) {
  const isZh = language === "zh";
  const allKnowledge = [];

  for (const chunk of chunks) {
    const system = isZh
      ? "你是知识点提取专家。从内容中提取可考察的知识点。"
      : "You are a knowledge extraction expert. Extract testable knowledge points.";

    const chunkText = chunk.blocks
      .map((b) => `[${b._id}] ${b.text}`)
      .join("\n\n");

    const prompt = isZh
      ? `从以下内容提取可考察的知识点（定义、概念、比较、步骤、常见错误等）。
每个知识点必须标注证据来源的 blockId。

内容：
${chunkText}

输出 JSON：
{
  "knowledgePoints": [
    {
      "fact": "知识点描述",
      "type": "definition|comparison|procedure|pitfall|concept",
      "evidenceBlockIds": ["blockId"]
    }
  ]
}`
      : `Extract testable knowledge points (definitions, concepts, comparisons, procedures, pitfalls).
Each must cite evidence blockIds.

Content:
${chunkText}

Output JSON:
{
  "knowledgePoints": [
    {
      "fact": "knowledge description",
      "type": "definition|comparison|procedure|pitfall|concept",
      "evidenceBlockIds": ["blockId"]
    }
  ]
}`;

    const result = await generateJson({
      system,
      messages: [{ role: "user", content: prompt }],
      schema: KNOWLEDGE_SCHEMA,
      temperature: 0.5,
    });

    allKnowledge.push(...result.knowledgePoints);
  }

  return allKnowledge;
}
