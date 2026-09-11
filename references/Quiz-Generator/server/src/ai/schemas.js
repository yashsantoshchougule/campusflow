export const CHUNK_SCHEMA = {
  required: ["chunks"],
  properties: {
    chunks: {
      type: "array",
      items: {
        required: ["topic", "blockIds"],
        properties: {
          topic: { type: "string" },
          blockIds: { type: "array" },
        },
      },
    },
  },
};

export const KNOWLEDGE_SCHEMA = {
  required: ["knowledgePoints"],
  properties: {
    knowledgePoints: {
      type: "array",
      items: {
        required: ["fact", "type", "evidenceBlockIds"],
        properties: {
          fact: { type: "string" },
          type: { type: "string" },
          evidenceBlockIds: { type: "array" },
        },
      },
    },
  },
};

export const BLUEPRINT_SCHEMA = {
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        required: ["knowledgeIndex", "difficulty", "topic"],
        properties: {
          knowledgeIndex: { type: "number" },
          difficulty: { type: "string" },
          topic: { type: "string" },
        },
      },
    },
  },
};

export const QUESTION_SCHEMA = {
  required: [
    "question",
    "options",
    "correctAnswerIndex",
    "explanation",
    "difficulty",
    "citationPointers",
  ],
  properties: {
    question: { type: "string" },
    options: { type: "array", minItems: 4, maxItems: 4 },
    correctAnswerIndex: { type: "number", minimum: 0, maximum: 3 },
    explanation: { type: "string" },
    difficulty: { type: "string" },
    tags: { type: "array" },
    citationPointers: {
      type: "array",
      items: {
        required: ["blockId"],
        properties: {
          blockId: { type: "string" },
        },
      },
    },
  },
};
