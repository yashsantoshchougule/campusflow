import { generateJson } from "../provider.js";
import { CHUNK_SCHEMA } from "../schemas.js";

export async function runStructurer(blocks, language) {
  const isZh = language === "zh";

  const system = isZh
    ? "你是一个文档结构分析专家。将内容块按主题分组。"
    : "You are a document structuring expert. Group content blocks by topic.";

  const blockSummary = blocks.map((b) => ({
    id: b._id.toString(),
    sourceRef: b.sourceRef,
    preview: b.text.substring(0, 200),
  }));

  const prompt = isZh
    ? `分析以下内容块，按主题分组。每个组包含相关的 blockId 列表。
    
    内容块：
    ${JSON.stringify(blockSummary, null, 2)}

    输出 JSON 格式：
    {
    "chunks": [
        {
        "topic": "主题名称",
        "blockIds": ["blockId1", "blockId2"]
        }
    ]
    }`
    : `Analyze these content blocks and group by topic. Each group contains related blockIds.

    Blocks:
    ${JSON.stringify(blockSummary, null, 2)}

    Output JSON:
    {
    "chunks": [
        {
        "topic": "topic name",
        "blockIds": ["blockId1", "blockId2"]
        }
    ]
    }`;

  const result = await generateJson({
    system,
    messages: [{ role: "user", content: prompt }],
    schema: CHUNK_SCHEMA,
    temperature: 0.3,
  });

  // Attach actual blocks to chunks
  return result.chunks.map((chunk) => ({
    ...chunk,
    blocks: blocks.filter((b) => chunk.blockIds.includes(b._id.toString())),
  }));
}
