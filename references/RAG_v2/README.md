# RAG_v2

RAG_v2 is a modular, AI-powered study assistant designed to help users learn more effectively from their own uploaded materials. The application combines a React-based frontend with a FastAPI backend to deliver an end-to-end experience for ingestion, semantic search, notes, quizzes, analytics, and adaptive roadmaps.

The project is currently in active development. The codebase already follows a modular structure for easier maintenance and future expansion, while ongoing work focuses on data migration and multi-user support.

---

## 1. Project Overview

RAG_v2 is built around a retrieval-augmented generation workflow. Users can:

- Upload study materials and ingest them into a searchable knowledge base
- Ask questions and receive grounded answers based on the uploaded content
- Create and manage personal notes
- Generate quizzes from the indexed material
- Track weak topics and learning progress
- Follow a roadmap constructed around the subject structure

The goal is to create a practical learning environment where AI assistance is grounded in user-specific content rather than generic responses.

---

## 2. Current Project Status

The project is currently in a transitional phase with the following priorities:

- Modularizing the backend and frontend for maintainability
- Improving multi-user support and user-scoped data handling
- Migrating part of the data model from local files to a more robust backend-driven flow
- Preparing the app for smoother deployment and scaling

Important note:
- For local testing, use subjects such as Java or AI, since sample data for those subjects is already included in the repository.
- Deployment on Vercel may not behave exactly as expected while the migration and multi-user work is still in progress.

---

## 3. Core Architecture

The system is split into two main layers:

- Frontend: React + Vite + Tailwind CSS for the user interface
- Backend: FastAPI for API routing, authentication, ingestion, search, quiz logic, notes, and roadmap handling

The backend uses a retrieval layer powered by FAISS and embeddings from Cohere, while responses are generated through an LLM workflow grounded in the indexed content.

### High-level flow

```bash
User -> Frontend -> FastAPI Backend -> FAISS / Embeddings / LLM -> Response / Quiz / Roadmap / Notes
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend | React + Vite | SPA user interface and app routing |
| Styling | Tailwind CSS | Responsive UI and component styling |
| Backend | FastAPI | API development, request handling, and business logic |
| Validation | Pydantic | Request/response model validation |
| Vector Search | FAISS | Efficient semantic similarity search over indexed content |
| Embeddings | Cohere embed-english-light-v3.0 | Text-to-vector representation for retrieval |
| LLM | Cohere Command-R | Context-aware response generation and quiz logic |
| Auth & Data | Supabase | Authentication and data persistence support |
| Package Management | npm / pip | Frontend and backend dependency management |

---

## 5. Project Structure

```bash
RAG_v2/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth.py
│   │   │   ├── config.py
│   │   │   └── supabase_client.py
│   │   ├── modules/
│   │   │   ├── Analytics/
│   │   │   ├── books/
│   │   │   ├── Ingestion/
│   │   │   ├── Notes/
│   │   │   ├── Qa/
│   │   │   ├── Quiz/
│   │   │   └── Roadmap/
│   │   └── main.py
│   ├── data/
│   │   └── uploads/
│   ├── faiss_index/
│   ├── notes_faiss_index/
│   ├── requirements.txt
│   └── render.yaml
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── supabaseClient.js
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docs/
├── LICENSE
└── README.md
```

---

## 6. Backend Modules

The backend is organized into feature-oriented modules under the app/modules directory. Each module is designed to represent a specific responsibility in the learning workflow, keeping the application easier to maintain and scale as new features are added.

### 6.1 Analytics Module

The Analytics module is responsible for collecting, organizing, and exposing learning-related performance data.

What it is expected to do:
- Track quiz performance over time
- Record weak topics based on past assessment results
- Support progress visualization and insights for the dashboard
- Provide structured data that can later be used for recommendations and reporting

Typical responsibilities:
- Reading quiz history and learning outcomes
- Aggregating subject-based performance data
- Preparing summaries for analytics views and reports

Typical payload example:

```json
{
  "subject": "AI",
  "score": 4,
  "total": 5,
  "weak_topics": ["Neural Networks", "Transformers"],
  "timestamp": "2026-07-22T10:30:00Z"
}
```

### 6.2 Books Module

The Books module handles study materials that are represented as books or book-like resources within the application.

What it is expected to do:
- Retrieve available books and their metadata
- Support linkages between a selected book and the current study flow
- Provide content that can be displayed in the study reader experience

Typical responsibilities:
- Fetching book details by ID
- Returning signed or accessible file references
- Managing study-book context for the frontend

Typical payload example:

```json
{
  "id": "book_001",
  "title": "Introduction to AI",
  "subject": "AI",
  "signed_url": "https://example.com/book.pdf"
}
```

### 6.3 Ingestion Module

The Ingestion module is one of the most important parts of the system because it transforms uploaded content into searchable knowledge.

What it is expected to do:
- Read uploaded documents and files
- Split content into manageable chunks
- Generate embeddings for those chunks
- Store them into the FAISS index so the app can retrieve them later

Typical responsibilities:
- Processing uploaded files from the frontend
- Creating vector representations for search and Q&A
- Updating the shared knowledge base after new uploads

Typical payload example:

```json
{
  "message": "File ingested successfully",
  "filename": "AI.md",
  "chunks_created": 42
}
```

### 6.4 Notes Module

The Notes module provides a personal knowledge-management layer for users.

What it is expected to do:
- Create and update notes for a selected subject
- Store note content in a structured, retrievable format
- Generate tags automatically from note content
- Index notes so they can participate in question answering

Typical responsibilities:
- Creating and editing markdown-based notes
- Fetching notes by subject or tag
- Generating semantic tags for better organization
- Syncing note content into the notes FAISS index

Typical payload example:

```json
{
  "subject": "AI",
  "title": "Transformer Basics",
  "content": "Transformers use attention mechanisms to process input efficiently.",
  "tags": ["transformers", "attention", "neural networks"]
}
```

### 6.5 QA Module

The QA module powers the conversational study assistant experience.

What it is expected to do:
- Receive a user question
- Search relevant context from uploaded content and notes
- Return a grounded answer using the indexed material
- Provide source references where possible

Typical responsibilities:
- Routing user questions to the appropriate vector store
- Combining material from shared uploads and personal notes
- Returning a concise answer with supporting evidence

Typical payload example:

```json
{
  "question": "What is the role of attention in transformers?"
}
```

Expected response shape:

```json
{
  "answer": "Attention allows the model to focus on the most relevant parts of the input sequence.",
  "sources": ["AI.md", "notes/transformer_basics.md"]
}
```

### 6.6 Quiz Module

The Quiz module is responsible for generating and evaluating assessments based on the ingested content.

What it is expected to do:
- Create multiple-choice questions from the active subject knowledge
- Evaluate user answers against the expected solutions
- Identify weak topics that need further study
- Return results that can be used by the analytics and roadmap modules

Typical responsibilities:
- Generating quizzes dynamically from indexed content
- Scoring student answers
- Identifying weak areas based on incorrect responses

Typical payload example:

```json
{
  "subject": "AI",
  "topics": ["Neural Networks"],
  "question_count": 5
}
```

Expected response shape:

```json
{
  "quiz": [
    {
      "question": "What is the purpose of a neural network?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A"
    }
  ]
}
```

### 6.7 Roadmap Module

The Roadmap module manages the structured learning plan for each subject.

What it is expected to do:
- Build a study roadmap from syllabus-like topic structures
- Track topic statuses such as locked, available, in progress, waiting quiz, or completed
- Support transitions between learning and evaluation stages
- Help users progress through topics in a controlled sequence

Typical responsibilities:
- Generating weekly study plans
- Updating the status of each topic as the user progresses
- Starting and completing topics
- Supporting roadmap extension and final assessment scheduling

Typical payload example:

```json
{
  "subject": "AI",
  "week": 1,
  "topic_name": "Introduction to AI"
}
```

Expected response shape:

```json
{
  "success": true,
  "message": "Topic started"
}
```

---

## 7. Architecture Overview

```bash
User
  └── Frontend (React + Vite)
        └── FastAPI Backend
              ├── Ingestion Module
              ├── Notes Module
              ├── QA Module
              ├── Quiz Module
              ├── Roadmap Module
              └── Analytics Module
                    └── FAISS / Embeddings / LLM
```

This architecture allows the application to separate concerns while still providing a unified learning experience.

---

## 8. Main API Endpoints

The backend exposes several core endpoints to support the product experience:

- POST /ingest — upload and index study material
- POST /ask — ask a question and receive a grounded answer
- POST /generate-quiz — create quiz questions from indexed content
- POST /evaluate — submit quiz answers and receive scoring results
- POST /notes — create or save notes
- GET /notes — retrieve stored notes
- POST /notes/generate-tags — generate tags for notes
- POST /roadmap — create a roadmap for a subject
- GET /roadmap/{subject} — fetch the roadmap for a subject
- PUT /roadmap/{subject}/start-topic — start a topic
- PUT /roadmap/{subject}/complete-topic — complete a topic

---

## 9. Example User Workflow

A typical user journey looks like this:

```bash
1. Sign in to the app
2. Upload learning material
3. Ingest content into the knowledge base
4. Ask questions using the QA assistant
5. Generate a quiz from the uploaded content
6. Review weak topics and progress
7. Follow the roadmap to study in a structured way
```

This flow demonstrates how the system connects ingestion, learning, assessment, and planning into one experience.

---

## 10. Environment Variables

The app expects certain environment values to be configured for full functionality.

Example variables:

```bash
COHERE_API_KEY=your_cohere_key
VITE_API_URL=http://localhost:8000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

These values are required for authentication, AI features, and backend communication.

---

## 11. Current Features vs Planned Features

### Current Features
- Upload and ingest study material
- Semantic question answering
- Notes creation and indexing
- Quiz generation and evaluation
- Roadmap-based guided learning
- Basic analytics and progress tracking

### Planned Features
- Full multi-user support
- Stronger data migration and persistence flow
- Improved roadmap and quiz integration
- More advanced analytics dashboards
- Better deployment readiness for production environments

---

## 12. Frontend Experience

The frontend provides a polished learning experience through separate screens and workflows:

- Landing and authentication screens
- Upload workflow for study materials
- Dashboard for navigation and progress overview
- Study reader experience
- Quiz flow for assessment
- Notes editor and viewer
- QA interface for conversational learning support
- Roadmap visualization and topic progression

The frontend is currently being refined to align more closely with the modular backend architecture and the upcoming multi-user experience.

---

## 13. Main Features

### 13.1 Material Ingestion
Users can upload study files and have the system ingest them into a vector store for later retrieval.

### 13.2 Semantic Question Answering
The system can answer questions using the uploaded material and user notes as context.

### 13.3 Notes Management
Users can create structured notes, tag them, and search them later.

### 13.4 Quiz Generation and Evaluation
The app can generate quiz questions from the indexed content and evaluate the results.

### 13.5 Adaptive Roadmap
The roadmap module organizes study content into milestones and topic progress states.

### 13.6 Analytics Tracking
The system records quiz history and learning-related insights to support follow-up study strategies.

---

## 14. Local Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux / macOS
venv\Scripts\activate      # Windows PowerShell
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Notes for testing

Use subjects such as:

```bash
Java
AI
```

These subjects already have sample content available in the repository for easier testing.

---

## 15. Environment and Deployment Notes

The project currently relies on environment configuration for API keys and backend integration. The app is being actively improved for multi-user handling and better data consistency.

Because of the ongoing migration work:

- Local development is the recommended path for now
- Vercel deployment may not be fully reliable until the migration work is completed
- Production readiness will improve as the data model and user-scoping logic are finalized

---

## 16. Development Roadmap

Planned improvements include:

- Completing the multi-user architecture
- Strengthening data migration and persistence flow
- Improving roadmap and quiz integration
- Refining frontend state management and user experience
- Enhancing analytics and progress reporting
- Improving deployment readiness for production environments

---

## 17. Summary

RAG_v2 is a practical AI study assistant that combines retrieval-augmented generation, notes, quizzes, roadmaps, and analytics into one unified learning platform. It is already functional in its current form, and the project is now focused on making it more scalable, modular, and suitable for broader multi-user use.
 