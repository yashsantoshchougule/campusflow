import { generateJson } from "../provider.js";
import { BLUEPRINT_SCHEMA } from "../schemas.js";

export async function runQuizPlanner(knowledgePoints, params) {
  const {
    count = 15,
    difficulty = { easy: 5, medium: 7, hard: 3 },
    language,
  } = params;
  const isZh = language === "zh";

  const system = isZh
    ? "你是出题规划专家。根据知识点和难度要求制定出题蓝图。"
    : "You are a quiz planning expert. Create a blueprint based on knowledge points and difficulty requirements.";

  const knowledgeSummary = knowledgePoints.map((kp, idx) => ({
    index: idx,
    fact: kp.fact,
    type: kp.type,
  }));

  const prompt = isZh
    ? `制定出题蓝图：总共 ${count} 道题，难度分布：简单 ${
        difficulty.easy
      }，中等 ${difficulty.medium}，困难 ${difficulty.hard}。

知识点列表：
${JSON.stringify(knowledgeSummary, null, 2)}

输出 JSON：
{
  "questions": [
    {
      "knowledgeIndex": 0,
      "difficulty": "easy|medium|hard",
      "topic": "题目主题"
    }
  ]
}

要求：
- 覆盖不同知识点，避免重复
- 符合难度分布
- 优先选择重要知识点`
    : `Create blueprint: ${count} questions total, difficulty: easy ${
        difficulty.easy
      }, medium ${difficulty.medium}, hard ${difficulty.hard}.

Knowledge points:
${JSON.stringify(knowledgeSummary, null, 2)}

Output JSON:
{
  "questions": [
    {
      "knowledgeIndex": 0,
      "difficulty": "easy|medium|hard",
      "topic": "question topic"
    }
  ]
}

Requirements:
- Cover different knowledge points, avoid duplication
- Match difficulty distribution
- Prioritize important knowledge`;

  const result = await generateJson({
    system,
    messages: [{ role: "user", content: prompt }],
    schema: BLUEPRINT_SCHEMA,
    temperature: 0.7,
  });

  // Attach knowledge to blueprint
  return {
    questions: result.questions.map((q) => ({
      ...q,
      knowledge: knowledgePoints[q.knowledgeIndex],
    })),
  };
}
