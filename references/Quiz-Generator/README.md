# Quiz Generator - AI-Powered Quiz Generation from Documents

A full-stack quiz generator that automatically creates high-quality multiple-choice questions from documents (PPTX/PDF/DOCX/TXT) with citation tracking and quality verification.

## Core Features

- 📄 **Multi-Format Support**: PPTX, PDF, DOCX, TXT
- 🤖 **AI-Driven**: Powered by OpenAI/Anthropic for high-quality question generation
- 📚 **Citation Tracking**: Every question includes source page/slide and original text quotes
- ✅ **Quality Control**: Automatic verification rejects or rewrites low-quality questions
- 🔒 **Anonymous Sessions**: No login required, session-based access control
- ⏰ **Auto-Cleanup**: 24-hour TTL for automatic data expiration
- 🎯 **Wrong Answer Review**: Smart analysis with source citations

## Tech Stack

### Frontend

- React 18 (Vite)
- React Router v6
- Axios

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Multer (file uploads)
- Document parsing: pdf-parse, mammoth, pizzip

### AI

- OpenAI / Anthropic (switchable)
- Structured JSON outputs
- Multi-agent pipeline

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB >= 5.0 (local or MongoDB Atlas)
- OpenAI API Key or Anthropic API Key

### Installation

1. **Clone the repository**

```bash
git clone <repo-url>
cd quiz-generator
```

2. **Install backend dependencies**

```bash
cd server
npm i
```

3. **Install frontend dependencies**

```bash
cd ../client
npm i
```

### Environment Configuration

#### Backend (`/server/.env`)

Copy `.env.example` and fill in:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/quizgen

# AI Provider (choose one)
AI_PROVIDER=openai
# AI_PROVIDER=anthropic

# OpenAI (if using openai)
OPENAI_API_KEY=sk-...

# Anthropic (if using anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Session
SESSION_EXPIRY_HOURS=24
```

#### Frontend (`/client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

### Start the Application

#### Option 1: Separate Terminals (Recommended for Development)

**Terminal 1 - Backend**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**

```bash
cd client
npm run dev
```

Visit: http://localhost:5173

#### Option 2: Concurrent Script (requires concurrently)

```bash
# In root directory
npm install -g concurrently
concurrently "cd server && npm run dev" "cd client && npm run dev"
```

## User Flow

1. **Visit Website** - Auto-creates anonymous session (sessionId)
2. **Upload Document** - Supports PPTX/PDF/DOCX/TXT
3. **Document Parsing** - Extracts structured content (page/slide + text)
4. **Configure Parameters** - Question count, language, difficulty distribution
5. **Generate Quiz** - AI pipeline generates questions (with progress bar)
6. **Take Quiz** - 4-option multiple choice questions
7. **View Results** - Score + explanations + source citations
8. **Review Mistakes** - Wrong answers with original text quotes

## API Documentation

### Sessions

- `POST /api/sessions` - Create session
  - Response: `{ sessionId }`

### Documents

- `POST /api/docs/upload` - Upload document
  - Headers: `x-session-id`
  - Body: `multipart/form-data` with `file`
  - Response: `{ documentId, filename, ... }`

- `GET /api/docs` - List documents
  - Headers: `x-session-id`
  - Response: `[{ _id, filename, stats, ... }]`

- `GET /api/docs/:id` - Get document details (with blocks preview)
  - Headers: `x-session-id`
  - Response: `{ document, blocks }`

### Quizzes

- `POST /api/quizzes` - Create quiz (async)
  - Headers: `x-session-id`
  - Body: `{ documentId, params: { count, language, difficulty } }`
  - Response: `{ jobId, quizId }`

- `GET /api/jobs/:jobId` - Check job status
  - Headers: `x-session-id`
  - Response: `{ status, progress, logs, ... }`

- `GET /api/quizzes/:quizId` - Get questions (without answers)
  - Headers: `x-session-id`
  - Response: `{ quiz, questions }`

- `POST /api/quizzes/:quizId/submit` - Submit answers
  - Headers: `x-session-id`
  - Body: `{ answers: [0, 2, 1, ...] }`
  - Response: `{ score, results: [{ correct, explanation, citations }] }`

- `GET /api/quizzes/:quizId/review` - Wrong answer review
  - Headers: `x-session-id`
  - Response: `{ wrongQuestions: [...] }`

## AI Agent Pipeline

Question generation goes through 6 steps:

1. **Structurer** - Groups blocks by topic
2. **Knowledge Extractor** - Extracts testable knowledge points
3. **Quiz Planner** - Creates blueprint (difficulty distribution, topic coverage)
4. **Question Generator** - Generates questions + citations
5. **Verifier** - Validates quality (citations support answers, unique correct option)
6. **Assembler** - Saves to database

Each step logs its progress for debugging.

## Automatic Data Expiration (TTL)

All data automatically deletes 24 hours after creation:

- Session
- Document
- Block
- Quiz
- Question
- Attempt
- Job

MongoDB TTL indexes handle cleanup automatically.

## Citations Rules

- Each question's `citations` is an array: `[{ sourceRef, blockId, quote }]`
- `quote` is **actually extracted** from Block.text (not AI-generated)
- Backend code handles text extraction to ensure 100% authenticity
- Verifier checks if quotes support question and answer

## Switching AI Providers

Modify `/server/.env`:

```env
# Use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Or use Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Restart backend to apply changes.

## Testing

```bash
cd server
npm test
```

Includes:

- Session creation + document upload test
- Quiz job creation + status polling test

## FAQ

### Q: PPTX parsing unstable?

A: Current implementation prioritizes PDF/DOCX/TXT reliability. PPTX parsing using pizzip may have limitations - recommend uploading PDF version.

### Q: Question generation fails?

A: Check:

1. AI API key is correct
2. Document has sufficient content (at least 500 words)
3. View Job logs (`GET /api/jobs/:jobId`)

### Q: When is data cleaned up?

A: All data auto-deletes 24 hours after creation (MongoDB TTL).

### Q: How to debug AI generation?

A: Check Job logs - each agent step is recorded.

## Project Structure

- `/server/src/ai/agents/` - AI pipeline steps
- `/server/src/models/` - Mongoose data models
- `/server/src/services/` - Business logic
- `/client/src/pages/` - Frontend pages
- `/client/src/components/` - Reusable components

## License

MIT

## Contributing

Pull requests welcome!
