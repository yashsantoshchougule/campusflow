import { generateJson } from "../provider.js";
import { QUESTION_SCHEMA } from "../schemas.js";

export async function runQuestionGenerator(blueprint, blocks, language) {
  const isZh = language === "zh";
  const questions = [];

  for (const item of blueprint.questions) {
    const { knowledge, difficulty, topic } = item;

    // Get evidence blocks
    const evidenceBlocks = blocks.filter((b) =>
      knowledge.evidenceBlockIds.includes(b._id.toString())
    );

    const system = isZh
      ? "你是专业出题专家。生成高质量选择题（4个选项，1个正确答案）。"
      : "You are a professional question writer. Generate high-quality MCQs (4 options, 1 correct answer).";

    const evidenceText = evidenceBlocks
      .map((b) => `[BlockId: ${b._id}]\n[SourceRef: ${b.sourceRef}]\n${b.text}`)
      .join("\n\n---\n\n");

    const prompt = isZh
      ? `基于以下内容生成一道选择题。

知识点：${knowledge.fact}
难度：${difficulty}
主题：${topic}

证据内容：
${evidenceText}

输出 JSON：
{
  "question": "题干",
  "options": ["选项A", "选项B", "选项C", "选项D"],
  "correctAnswerIndex": 0,
  "explanation": "解析（为什么这个答案正确，其他错误）",
  "difficulty": "${difficulty}",
  "tags": ["标签1", "标签2"],
  "citationPointers": [
    {
      "blockId": "引用的blockId",
      "relevantText": "相关原文片段的简短描述（用于后端定位）"
    }
  ]
}

要求：
- 题干清晰无歧义
- 4个选项，只有1个正确
- 正确答案必须能从证据内容支撑
- citationPointers 指向支撑答案的 blockId
- 干扰项合理但明确错误`
      : `Generate an MCQ based on this content.

Knowledge: ${knowledge.fact}
Difficulty: ${difficulty}
Topic: ${topic}

Evidence:
${evidenceText}

Output JSON:
{
  "question": "question stem",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswerIndex": 0,
  "explanation": "why this answer is correct and others are wrong",
  "difficulty": "${difficulty}",
  "tags": ["tag1", "tag2"],
  "citationPointers": [
    {
      "blockId": "cited blockId",
      "relevantText": "brief description of relevant text (for backend to locate)"
    }
  ]
}

Requirements:
- Clear, unambiguous question
- Exactly 4 options, only 1 correct
- Correct answer must be supported by evidence
- citationPointers reference supporting blockIds
- Distractors are plausible but clearly wrong`;

    try {
      const result = await generateJson({
        system,
        messages: [{ role: "user", content: prompt }],
        schema: QUESTION_SCHEMA,
        temperature: 0.8,
      });

      // Attach blocks for later quote extraction
      result.evidenceBlocks = evidenceBlocks;
      questions.push(result);
    } catch (error) {
      console.error("Question generation failed:", error);
      // Skip this question
    }
  }

  return questions;
}
