import { generateJson } from "../provider.js";
import { extractQuotes } from "../../utils/quotes.js";

export async function runVerifier(rawQuestions, blocks, targetCount, language) {
  const isZh = language === "zh";
  const verified = [];
  const maxRetriesPerQuestion = 2;

  for (const rawQ of rawQuestions) {
    let attempts = 0;
    let isValid = false;
    let question = rawQ;

    while (attempts <= maxRetriesPerQuestion && !isValid) {
      // Extract actual quotes from blocks
      const citations = extractQuotes(question.citationPointers, blocks);
      question.citations = citations;

      // Verify question quality
      const validation = await verifyQuestion(question, language);

      if (validation.isValid) {
        isValid = true;
        verified.push(question);
        break;
      } else {
        attempts++;
        if (attempts <= maxRetriesPerQuestion) {
          // Attempt to rewrite
          question = await rewriteQuestion(
            question,
            validation.issues,
            language,
          );
        }
      }
    }

    // If verified enough questions, stop
    if (verified.length >= targetCount) break;
  }

  // If still not enough, keep the best we have
  return verified.slice(0, targetCount);
}

async function verifyQuestion(question, language) {
  const isZh = language === "zh";

  const system = isZh
    ? "你是题目质量审核专家。检查题目是否符合标准。"
    : "You are a question quality reviewer. Check if the question meets standards.";

  const quotesText = question.citations
    .map((c) => `[${c.sourceRef}] "${c.quote}"`)
    .join("\n");

  const prompt = isZh
    ? `检查这道题是否符合要求：

题目：${question.question}
选项：${JSON.stringify(question.options)}
正确答案索引：${question.correctAnswerIndex}
解析：${question.explanation}

引用原文：
${quotesText}

检查项：
1. 题干清晰无歧义？
2. 正好4个选项？
3. 正确答案索引 0-3？
4. 只有1个正确答案，其他明确错误？
5. 正确答案能从引用原文支撑？
6. 解析合理？

输出 JSON：
{
  "isValid": true/false,
  "issues": ["问题1", "问题2"]
}`
    : `Verify this question:

Question: ${question.question}
Options: ${JSON.stringify(question.options)}
Correct: ${question.correctAnswerIndex}
Explanation: ${question.explanation}

Citations:
${quotesText}

Check:
1. Clear question?
2. Exactly 4 options?
3. Correct index 0-3?
4. Only 1 correct, others clearly wrong?
5. Correct answer supported by citations?
6. Valid explanation?

Output JSON:
{
  "isValid": true/false,
  "issues": ["issue1", "issue2"]
}`;

  try {
    return await generateJson({
      system,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
  } catch (error) {
    return { isValid: false, issues: ["Verification failed"] };
  }
}

async function rewriteQuestion(question, issues, language) {
  const isZh = language === "zh";

  const system = isZh
    ? "你是题目修正专家。根据问题重写题目。"
    : "You are a question revision expert. Rewrite based on issues.";

  const prompt = isZh
    ? `以下题目有问题，请修正：

原题：${question.question}
原选项：${JSON.stringify(question.options)}
问题：${issues.join(", ")}

证据内容：
${question.evidenceBlocks.map((b) => b.text).join("\n\n")}

输出修正后的题目（JSON 格式同前）`
    : `This question has issues, please revise:

Original: ${question.question}
Options: ${JSON.stringify(question.options)}
Issues: ${issues.join(", ")}

Evidence:
${question.evidenceBlocks.map((b) => b.text).join("\n\n")}

Output revised question (same JSON format)`;

  try {
    const revised = await generateJson({
      system,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    revised.evidenceBlocks = question.evidenceBlocks;
    return revised;
  } catch (error) {
    return question; // Return original if rewrite fails
  }
}
