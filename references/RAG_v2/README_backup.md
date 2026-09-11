Note: for tests use Java or Ai in subject name and use them as existing data to test as they are already ingested
another thing I'm currently working on data migration and multi user system so vercel might not work as intended right now.but let's hope it's ok hehe!

Note: $ folder structure is different now took a modular approach they call it i think feature first approach and i think it's easy to track codes but core functions are still same 

# RAG_v2
RAG-based student assistant project, featuring syllabus roadmap analysis, quiz-based weak topic detection, personalized recommendations, and enhanced academic support, with additional AI-powered learning features planned for future developmen

```
            [ Student / Client Browser ]
                           │
                   Vite / React SPA
                           │
                 (RESTful API / JSON)
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                     ▼
 [ Ingestion Engine ]                [ Core API Gateway ]
(FastAPI / PyPDF / Etc.)             (FastAPI App Routing)
        │                                     │
        ▼                                     ├──► [ Quiz Engine ] ──► quiz_history.json
┌──────────────────┐                          ├──► [ Roadmap Maker ] ──► roadmaps/
│  Document Split  │                          ├──► [ Notes CRUD ] ──► notes_metadata.json
└────────┬─────────┘                          │
         ▼                                    ▼
[ Cohere Embed ]                     [ Cohere Command-R ]
(embed-english-light)                (command-r7b-12-2024)
        │                                     │
        ▼                              (Augmented Prompt)
┌───────────────────┐                         │
│ Vector DB Routing │◄────────────────────────┘
└─┬───────────────┬─┘
  ▼               ▼
[ FAISS Index ] [ Notes FAISS ]
(Reference)     (User Notes)
```

### Core Architecture Highlights
* **Dual-Vector DB Topology:** Isolates static domain references (uploaded lecture materials) from mutable, high-churn user data (personal notes) to optimize chunk matching precision and limit index cross-contamination.
* **Contextual Token Alignment:** Employs precise text splitting strategies to generate mathematically cohesive embeddings, balancing token window constraints of the text representation models with the context density requirements of the generation layers.
* **Asynchronous Execution Pathways:** Offloads intensive file processing, vector encoding, and model token streaming tasks through asynchronous constructs, maximizing API concurrent throughput under dense utilization loads.

---

## 2. Comprehensive Technology Stack

The platform's technology selection balances lightweight operational profiles with elite semantic precision, providing seamless horizontal scalability options across serverless deployment environments.

| Tier | Component | Technology Selection | Core Operational Role |
| :--- | :--- | :--- | :--- |
| **Backend** | API Gateway | **FastAPI (Python 3.10+)** | High-performance asynchronous routing, Pydantic type validation, automated OpenAPI metadata compilation. |
| **Frontend** | Application Engine | **React 18 + Vite** | Hot-module-swapping interface execution, efficient virtual DOM diffing, minimized bundled output asset weights. |
| **Frontend** | Design Matrix | **Tailwind CSS** | Atomic-utility responsive design tokens, rapid layout layout uniformity, zero runtime CSS parsing overhead. |
| **Vector DB** | Indexing Layer | **FAISS (Facebook AI Similarity Search)** | In-memory optimized L2 distance/cosine similarity vectors, low-latency nearest-neighbor computation. |
| **LLM Tier** | Inference Engine | **Cohere Command-R (7B-12-2024)** | High-context generative logic, structured JSON production, targeted citation grounding, and evaluation. |
| **Embeddings** | Representation | **Cohere embed-english-light-v3.0** | High-density 384-dimensional vector extraction tailored for rapid calculation within memory-constrained environments. |
| **Hosting** | Cloud Layer | **Render** | Dockerized or native python build packs running continuous integration for the ASGI web worker layers. |
| **Hosting** | Edge Network | **Vercel** | Global Content Delivery Network (CDN) static asset caching with low-latency edge caching for SPA artifacts. |

---

## 3. Directory Layout & Repository Topology
```
RAG_V2/
├── backend/                             # ASGI Service & Machine Learning Logic
│   ├── main.py                          # Application entry point, CORS middleware, and API router mappings
│   ├── quiz.py                          # Automated assessment generation, question grading, and parsing
│   ├── query.py                         # Context composition, index query routing, and RAG compilation
│   ├── ingestion.py                     # Document parser pipelines, text segmentation, and FAISS updates
│   ├── notes.py                         # Markdown text management, automated metadata stamping, and tags
│   ├── roadmap.py                       # Curriculum parser, time-boxed schedule creation, and task status
│   ├── tags/                            # Academic syllabus blueprints and structural knowledge domains
│   │   └── {subject}.json               # Hierarchical unit/topic breakdown templates for progress tracking
│   ├── data/                            # Persistent filesystem storage layers
│   │   ├── uploads/                     # Canonical PDF/TXT source data files grouped by subject area
│   │   └── notes/                       # Local storage folder for personal markdown note files
│   ├── faiss_index/                     # Serialized binary storage for primary document vectors
│   ├── notes_faiss_index/               # Serialized binary storage for personal notes vectors
│   └── analytics/                       # Local state store tracking student historical metrics
│       ├── quiz_history.json            # Array tracking subject attempts, performance ratios, and weaknesses
│       └── roadmaps/                    # Active and serialized timeline progress matrices
└── frontend/                            # Client-Side SPA User Interface
└── src/
├── App.jsx                      # Client router routing rules and application initialization
├── main.jsx                     # Strict mode execution binding to the application DOM anchor
└── components/                  # Encapsulated reusable layout view elements
├── LandingPage.jsx          # Visual portal, onboarding interface, and platform entry
├── UploadScreen.jsx         # Administrative document upload pane with file drop validation
├── Dashboard.jsx            # Unified analytics dashboard displaying macro statistics
├── QuizScreen.jsx           # Timed, distraction-free assessment delivery viewport
├── ResultScreen.jsx         # Performance diagnostic view highlighting concept deficiencies
├── QAScreen.jsx             # Conversational context interface with explicit source grounding
├── NotesScreen.jsx          # Dual-column notes browser featuring full text search mechanics
├── NoteEditor.jsx           # Real-time markdown workspace containing AI-assisted tags
├── NoteView.jsx             # High-readability document render pipeline for synthesized notes
├── GoalSetupScreen.jsx      # Configuration interface mapping timelines against syllabus scopes
└── RoadmapScreen.jsx        # Interactive interactive schedule containing completion tracking

```
---

## 4. Architectural Deep-Dives: Core Modules

### 4.1 The Advanced RAG Pipeline (`ingestion.py`, `query.py`)
EduPulse AI implements a robust, multi-index RAG system built to bypass traditional single-source information deficits.
```
[ Incoming File ] ──► [ Text Extraction ] ──► [ Overlapping Chunking ]
                                                        │
                                                        ▼
[ FAISS Binary Index ] ◄── [ Save Local ] ◄── [ Vector Generation ]
```
1. **Document Processing & Chunking Matrix:** Document ingestion uses sliding window text processing. Document nodes are split using precise character boundaries with a configurable token overlap (typically 512-character blocks with a 10% step-back overlap). This guarantees that edge-aligned semantic themes are preserved across adjoining text chunks.
2. **Dual Embedding Encoding:** Tokens are transmitted to the `embed-english-light-v3.0` API endpoint, yielding uniform, dense float matrices. These matrices are instantly serialized into two separate run-time vector memories: `faiss_index` (source content indexes) and `notes_faiss_index` (individual content logs).
3. **Multi-Route Query Vectorization & Merging:** When a question is submitted to `POST /ask`, the platform executes parallel searches. It issues concurrent queries across both database indices, gathers the top $K$ nearest-neighbor text blocks using vector distance matching, and scores them using relative relevance thresholds.
4. **Context Synthesis & Controlled Generation:** The matching text blocks are integrated into a system instruction block passed to `command-r7b-12-2024`. This prompt specifies strict grounding guidelines, forcing the model to cite specific text segments and reject hallucinating answers if the input text lacks the necessary information.

---

### 4.2 Algorithmic Quiz Synthesis & Evaluation (`quiz.py`)
Rather than relying on generic, ungrounded question prompt templates, the platform links quiz generation directly to document index segments that present high informational density.

* **Targeted Information Extraction:** The engine samples random text clusters within the ingested document indices or targets areas previously marked as "weak topics" in user logs.
* **Structured Generation Frameworks:** The model receives strict directives to construct multiple-choice questions (MCQs) mapped directly to specific data structures, enforcing a strict structural contract:
  ```json
  {
    "question": "Clear, objective academic query text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "rationale": "Context-grounded explanation explaining why option A is correct and why other options are incorrect."
  }
Performance Assessment & Weakness Detection: When answers are submitted via POST /evaluate, the response vectors are cross-checked against correct answer keys. If a student answers a question incorrectly, the underlying concept is cross-referenced with the subject syllabus file (tags/{subject}.json) and tagged into the weak_topics log within quiz_history.json. This provides targeted areas to prioritize during future search and review sessions.

### 4.3 Semi-Automated Note Management (notes.py)
The Notes System functions as a real-time knowledge creation space that automatically generates contextual metadata as users write.
Asynchronous Web Scraping Integration: When users insert web references, POST /notes/fetch-url runs low-overhead HTTP requests to parse the destination page's HTML structure, extract its Open Graph meta tags or header details, and automatically fill in reference links inside the note.
Semantic Tag Extraction: As notes are modified, the system processes text updates through the LLM to identify core concepts. It cross-references these concepts with the main syllabus taxonomy and automatically applies relevant tags, removing the need for manual user labeling.
Immediate Vector Index Synchronization: Once saved, the updated notes are instantly vectorized and merged into notes_faiss_index. This ensures that any personal observations or custom summaries are immediately searchable and accessible within the main Q&A chat loop.

### 4.4 Syllabus-Grounded Adaptive Roadmaps (roadmap.py)
Roadmaps in EduPulse AI are more than simple calendar alerts; they act as dynamic timelines built directly from official academic syllabus tracking templates.
```
[ Subject Syllabus JSON ] + [ Target End Date ] ──► [ LLM Time-Allocation Optimization ]
                                                             │
                                                             ▼
[ Interactive Interactive UI ] ◄───────────────── [ Weekly Milestone Grid ]
```
Syllabus Topology Ingestion: The engine opens the designated subject file within tags/{subject}.json to extract its structured units, core concept lists, and milestone requirements.
Context-Aware Schedule Distribution: Using the current calendar date and the student's target end date, the roadmap module calculates the available study weeks. The LLM then structures a milestone path, distributing complex topics evenly across the timeline while prioritizing areas previously identified as historical weaknesses.
State Tracking Interaction: Students can check off completed items, extend target timelines, or request itemized updates via PUT /roadmap/{subject}/extend. This lets them dynamically update their study schedules as their real-world deadlines shift.

## 5. Comprehensive API Documentation
### 5.1 Core System Elements

GET /
Functional Scope: Returns a basic payload indicating application health and validation status.
Response Signature: 200 OK
```
JSON
{
  "status": "healthy",
  "timestamp": "2026-06-16T10:20:00Z"
}
```
### 5.2 Document Processing & Ingestion Engine

POST /ingest
Functional Scope: Ingests a multi-page document file, runs text segmentation, generates embeddings, and saves the resulting vectors to the primary index.
Payload Format: multipart/form-data containing an academic file document binary.
Response Signature: 201 Created
```
JSON
{
  "status": "success",
  "filename": "operating_systems_lecture3.pdf",
  "chunks_processed": 142,
  "vector_index": "faiss_index"
}
```
### 5.3 Automated Assessment System
POST /generate-quiz
Functional Scope: Generates a set of contextually accurate multiple-choice questions pulled directly from reference indexes.
Payload Format: application/json
```
JSON
{
  "subject": "Distributed Systems",
  "question_count": 5,
  "difficulty": "Intermediate"
}
Response Signature: 200 OK

JSON
{
  "quiz_id": "qz_892341",
  "questions": [
    {
      "id": 1,
      "question": "Which consensus protocol requires a fixed membership list and operates via absolute majorities across successive voting rounds?",
      "options": ["Raft", "Paxos", "NTP Synchronization", "Gossip Protocols"],
      "rationale": "Paxos relies on strict quorums across phase transitions to maintain absolute state safety."
    }
  ]
}
```
POST /evaluate
Functional Scope: Validates submitted assessment responses, compiles immediate scores, updates performance analytics records, and identifies weak topic areas.
Payload Format: application/json
```
JSON
{
  "quiz_id": "qz_892341",
  "subject": "Distributed Systems",
  "answers": [{ "question_id": 1, "selected_option": "Gossip Protocols" }]
}
Response Signature: 200 OK

JSON
{
  "score": 0,
  "total": 1,
  "percentage": 0.0,
  "correct_keys": [{ "question_id": 1, "correct": "Paxos" }],
  "weak_topics_identified": ["Consensus Mechanisms", "Quorum Systems"]
}
```
GET /quiz-history
Functional Scope: Returns full historically serialized score trends and tracking arrays.
Response Signature: 200 OK

### 5.4 Unified RAG Search Interface
POST /ask
Functional Scope: Executes semantic searches across both vector indices and uses the LLM to generate a single, unified answer based on the retrieved context.
Payload Format: application/json
```
JSON
{
  "question": "What is the difference between sequential consistency and linearizability according to my class notes?",
  "subject": "Distributed Systems"
}
Response Signature: 200 OK

JSON
{
  "answer": "Based on your distributed systems lecture materials, linearizability requires operations to take effect at a discrete point in time between their invocation and response, enforcing global real-time ordering. Conversely, sequential consistency relaxes real-time constraints, requiring only that all processes observe an identical order of executions that preserves local program order.",
  "sources_extracted": [
    { "file": "distributed_notes_unit2.txt", "type": "note_index", "match_score": 0.89 },
    { "file": "reading_assignment_1.pdf", "type": "upload_index", "match_score": 0.81 }
  ]
}
```
### 5.5 Knowledge Base & Notes Control
POST /notes
Functional Scope: Commits a new raw text markdown block directly to disk.

Payload Format: application/json

GET /notes
Functional Scope: Fetches a clean list of all current note elements along with their automatically generated tag fields.

Response Signature: 200 OK
```
JSON
[
  {
    "filename": "raft_consensus_summary.md",
    "subject": "Distributed Systems",
    "title": "Raft Consensus Log Replication",
    "tags": ["Fault Tolerance", "Log Appending", "Leader Election"],
    "word_count": 420,
    "ingested": true
  }
]
```
POST /notes/generate-tags
Functional Scope: Evaluates text notes using context matching to generate optimized search tags.

Payload Format: application/json

POST /notes/ingest
Functional Scope: Encodes and pushes specific personal note files into the dedicated notes vector storage space (notes_faiss_index).

### 5.6 Curriculum & Pathway Planners
POST /roadmap
Functional Scope: Generates a time-allocated learning plan mapped directly to the syllabus file guidelines.

Payload Format: application/json
```
JSON
{
  "subject": "Machine Learning",
  "target_end_date": "2026-08-01"
}
```
Response Signature: 200 OK

PUT /roadmap/{subject}/complete-topic
Functional Scope: Marks a syllabus topic as completed and shifts upcoming milestone dates accordingly.

Payload Format: application/json
```
JSON
{ "unit_index": 0, "topic_name": "Backpropagation Calculus" }
```
Response Signature: 200 OK

## 6. Functional Architecture & Core User Workflows
```
  [ Landing Page Portal ]
            │
            ▼
  [ Upload Workspace ] ──► System updates FAISS index using source materials
            │
            ▼
  [ Learning Dashboard ]
            ├──► [ Automated Quizzes ] ──► Analyzes weak topics and updates score logs
            ├──► [ Conversational RAG ] ──► Runs search queries across primary & personal indices
            ├──► [ Knowledge Management ] ──► Generates semantic tags and links online references
            └──► [ Adaptive Roadmaps ] ──► Syncs study timeline goals with syllabus templates
```
### 6.1 System Entry & Context Onboarding
The entry workflow begins at the LandingPage component, which routes users to either the administrative data pipeline or the main telemetry dashboard. Users drop documents directly into the UploadScreen interface. The upload handler fires an asynchronous stream to the /ingest API endpoint, splitting files apart and populating the primary index (faiss_index) within seconds.

### 6.2 Collaborative Knowledge Synthesis & Study Loop
Once reference documents are indexed, the student uses the integrated learning workspace:

Interactive Self-Assessment: Students launch the QuizScreen to test their understanding under simulated test conditions. The server generates challenging multiple-choice questions directly from specific text passages, requiring deep recall instead of surface recognition.
Dynamic Review & Clarification: When the ResultScreen identifies areas that need improvement, the student switches directly to the QAScreen. They can ask deep clarifying questions, and the engine searches across textbook files and personal notes to resolve confusion.
Continuous Knowledge Retention: Students use the NoteEditor to write summaries of what they learn. The platform automatically scans their text, pulls in online reference details via the URL parser, assigns relevant tags, and syncs the content with the secondary index (notes_faiss_index). This updates the system's memory, ensuring those reflections are available during the next chat session.
Milestone Goal Management: The student configures a study timeline on the GoalSetupScreen to match their real-world exam dates. The platform builds a dynamic weekly schedule, laying out a guided path through the semester's material and adjusting milestones on the fly as topics are completed.

## 7. Data Storage Formats & Schema Blueprints
### 7.1 Historical Analytics Log (analytics/quiz_history.json)
Maintains an accurate record of student quiz attempts to track changes in comprehension over time.
```
JSON
[
  {
    "subject": "Database Management Systems",
    "date": "2026-06-15T14:35:10Z",
    "score": 4,
    "total": 5,
    "weak_topics": ["Two-Phase Locking (2PL)", "Cascading Aborts"]
  }
]
```
### 7.2 Structured Learning Pathway Schema (analytics/roadmaps/roadmap_{subject}.json)
Defines the current state of a student's active learning timeline and milestone allocations.
```
JSON
{
  "id": "rm_7182937",
  "subject": "Database Management Systems",
  "scope": "Full Semester Standard Syllabus",
  "weeks": [
    {
      "week_number": 1,
      "focus": "Relational Algebra & Tuple Calculus",
      "topics": [
        { "name": "Selection and Projection Operations", "status": "completed" },
        { "name": "Lossless-Join Decompositions", "status": "pending" }
      ]
    }
  ],
  "weak_topics": ["Lossless-Join Decompositions"],
  "status": "active"
}
```
### 7.3 Reference Taxonomy Schema (tags/{subject}.json)
The structural skeleton used to align generated questions and notes with an official academic curriculum.
```
JSON
{
  "subject": "Database Management Systems",
  "units": [
    {
      "unit": "Unit I",
      "name": "Relational Architecture & Storage Models",
      "topics": [
        "Selection and Projection Operations",
        "Lossless-Join Decompositions",
        "B+ Tree Indexing Structures"
      ]
    }
  ]
]
```
## 8. Development Roadmap & Core Code Tasks
To transition this proof-of-concept codebase into a scalable, multi-tenant enterprise system, the following operational changes are planned:

### 8.1 Interface Cleanup & User Flows

- Navigation Component Polish: Standardize header actions, clean up footer links, and insert defensive "Back" button routing blocks to prevent unsaved state loss in the NoteEditor and QuizScreen interfaces.

- Micro-Interaction Polish: Add subtle, low-overhead CSS transitions and loading skeletons within the dashboard view to mask network latency during intense LLM retrieval calls.

### 8.2 Production Telemetry & Analytics Dashboard
- Visual Progress Graphs: Replace raw text tables in Dashboard.jsx with responsive, data-driven charts tracking score trends, subject mastery ratios, and timeline velocity.

-  Concept Map Visualization: Build a structural concept tree interface that highlights areas needing review in red and mastered sections in green based on quiz histories.

### 8.3 Infrastructure Upgrades & Multi-Tenant Isolation
- Cloud Identity Integration (Supabase): Move away from open, local access profiles by integrating Supabase Auth to handle secure user logins, registration steps, and active session validation.

-  Strict Row-Level Partitioning: Update the file ingestion and database query paths to segregate index access. This ensures that user documents and notes are stored securely within isolated individual directories (/data/{user_id}/uploads), preventing cross-user data leaks.

-  Persistent Cloud Index Storage: Move localized in-memory binary vector indexes off transient servers and migrate them to a fully managed cloud database instance, ensuring persistent data reliability.

## 9. Environment Setup & Execution Guide
### 9.1 Required Prerequisites

- Python 3.10 or higher installed locally.
- Node.js LTS (v18 or higher) runtime environment.
- A valid Cohere API Authentication Token.

### 9.2 Initial Backend Installation Steps
Navigate into the service folder path:
```
Bash
cd backend
```
Build an isolated local virtual environment:
```
Bash
python -m venv venv
source venv/bin/activate  # On Windows execution environments: venv\\Scripts\\activate
```
Install required application packages:
```
Bash
pip install fastapi uvicorn cohere faiss-cpu pydantic pydantic-settings python-multipart
```
Configure your private environment variables:
```
Bash
export COHERE_API_KEY="your_secure_api_token_here"
```
Launch the local development server:
```
Bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
### 9.3 Frontend Workspace Setup Steps
Navigate into the client folder path:
```
Bash
cd ../frontend
```
Pull down required Node packages:
```
Bash
npm install
```
Start the local client development server:
```
Bash
npm run dev
Open your browser and navigate to http://localhost:5173 to interact with the running ecosystem.
```
## License

This project is licensed under the Apache License 2.0. See the `LICENSE` file for details.
