# ✨ ResuMate — AI-Powered Resume Builder Platform

<p align="center">

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-REST_API-black?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)
![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-AI_Features-8E75B2?logo=googlegemini)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-yellow)

</p>

A full-stack resume builder where every piece of AI assistance, template rendering, and dashboard insight is driven by the user's actual saved data — not mock content. ResuMate went through a full audit-and-rebuild cycle covering data-ownership security, schema/UI consistency, and a ground-up UI redesign (sidebar navigation, dark mode, a real AI chat assistant, and full account management) before reaching its current state.

---

## 🚀 Live Demo

| Application | Deployment |
|---|---|
| Frontend | https://resumate-eight-chi.vercel.app |
| Backend API | https://resumate-jet-rho.vercel.app |

---

## ✨ Key Highlights

- 7 professionally designed, independently themed resume templates with live preview
- Google Gemini 2.5 Flash integration: per-field AI rewriting, a full ATS compatibility scorer, and a dedicated conversational AI Assistant
- Persistent sidebar dashboard with a resume-overview donut chart, completion tracking, and a live-search resume list
- App-wide dark mode with explicit, OS-independent user control
- Auto-generated resume thumbnails via off-screen `html2canvas` capture
- Public, revocable read-only share links
- Ownership-safe resume CRUD — client requests can never hijack another user's data or force a resume public
- Full account lifecycle: profile editing, password change, and typed-confirmation account deletion that cascades through owned data

---

## 📚 Table of Contents

* [Overview](#overview)
* [Feature Breakdown](#-feature-breakdown)
* [Architecture](#-architecture)
* [Engineering Notes](#-engineering-notes)
* [Technology Stack](#-technology-stack)
* [Project Structure](#-project-structure)
* [Environment Variables](#-environment-variables)
* [Installation & Local Development](#-installation--local-development)
* [API Reference](#-api-reference)
* [Security Features](#-security-features)
* [Known Limitations & Roadmap](#-known-limitations--roadmap)
* [Contributing](#-contributing)
* [License](#-license)
* [Author](#-author)

---

## 🚀 Overview

ResuMate lets a user build a professional resume through a guided, section-by-section editor with a live preview beside it, pick from seven templates, get AI-assisted rewrites and an ATS compatibility score, export to PDF, and share a read-only link with recruiters — all backed by a dashboard that reflects real progress across every resume in the account, not placeholder stats.

The current build reflects a deliberate rebuild pass: a security review closed a mass-assignment gap that let API requests override resume ownership, a schema audit aligned the database with every field the templates actually render, and the entire dashboard/navigation layer was redesigned from a single top-navbar page into a persistent sidebar app — including three genuinely new sections (Templates, AI Assistant, Settings) backed by real endpoints, not just UI mockups.

---

## 🧩 Feature Breakdown

### 📄 Resume Management
- Create, duplicate, and delete resumes
- Step-by-step guided editor (Profile → Contact → Experience → Education → Skills → Projects → Certifications → Additional Info) with per-section validation
- Real-time live preview rendered beside the form as you type
- Auto-save 2.5 seconds after the last edit, with a save-status indicator
- Completion percentage computed by a single shared scoring function used identically by the dashboard and the editor, so the two never disagree

### 🎨 Templates

| Template | Style |
|---|---|
| Template 01 | Classic Two-Column |
| Template 02 | Modern Minimal |
| Template 03 | Professional Sidebar |
| Template 04 | Ultra Minimal Clean |
| Template 05 | Dark Sidebar |
| Template 06 | Creative Colorful Header |
| Template 07 | Executive Classic |

A dedicated **Templates page** lets you browse all seven with a live preview, then either start a brand-new resume with that template or apply it to any resume you already own — separate from the quick in-editor theme switcher.

### 🤖 AI Features (Google Gemini 2.5 Flash)
- **✨ Improve with AI** — rewrites work experience bullets, project descriptions, and professional summaries individually, each contextualized with the relevant role, company, or title
- **ATS Score Checker** — a 0–100 compatibility score with a per-section breakdown (contact info, summary, experience, skills, education, projects), top issues, top strengths, and found/missing keywords
- **AI Assistant** — a dedicated chat page for open-ended resume questions, optionally scoped to a specific resume's data via a context picker, with suggested starter prompts

### 📤 Export & Share
- **PDF Export** — high-quality A4 export via `html2pdf.js`
- **Public Share Links** — generate a revocable, read-only URL for recruiters; revoking immediately invalidates the link
- **Auto-Generated Thumbnails** — a real rendered preview of each resume, captured via `html2canvas`, shown on its dashboard card

### 🧭 Dashboard & Navigation
- Persistent sidebar: Dashboard, My Resumes, Templates, AI Assistant, Settings
- Stat cards — total resumes, average completion, last edited, and a computed profile-strength rating
- **Resume Overview** donut chart (completed / in progress / not started), rendered in pure SVG with no charting library dependency
- **Improve Your Resume** checklist, derived from your actual saved data across all resumes
- Live search that filters your resume list as you type

### ⚙️ Account & Settings
- Edit name and email
- Change password (requires re-entering the current one)
- **Delete account** — gated behind typing an exact confirmation phrase, then cascades through every resume and uploaded file you own before removing the account
- Light/dark mode toggle, applied app-wide and persisted across sessions

### 🔐 Auth & Security
- JWT-based authentication with a protected-route middleware
- Resume ownership enforced server-side — client requests cannot reassign a resume, force it public, or forge a share token
- bcrypt password hashing
- File uploads restricted by size and MIME type

---

## 🏗 Architecture

```text
┌──────────────────────────────────────────┐
│           React Frontend (Vite)            │
│  Landing · Dashboard · Editor · Templates   │
│  AI Assistant · Settings · Public Share View │
└────────────────────┬────────────────────────┘
                      │ HTTPS / REST (Axios)
                      ▼
┌──────────────────────────────────────────┐
│          Express API (Node.js)              │
│  JWT Auth · Resume CRUD · Share Links        │
│  AI Proxy (Gemini) · Multer File Uploads     │
└───────────────┬────────────────┬─────────────┘
                ▼                ▼
        ┌──────────────┐ ┌──────────────────┐
        │ MongoDB Atlas│ │  Google Gemini    │
        │  (Database)  │ │  2.5 Flash API    │
        └──────────────┘ └──────────────────┘
```

---

## 🔎 Engineering Notes

A few decisions worth calling out, each solving a specific real bug rather than a generic checklist item:

### 🖼️ Off-Screen Thumbnail Capture
Dashboard cards show a real rendered preview of each resume. `html2canvas` cannot rasterize an element with `display: none` — it has no layout box to capture. The hidden render target used for thumbnail generation is positioned **off-screen** (`position: absolute; left: -9999px`) instead of hidden, so capture always succeeds.

### 🔗 Host-Independent Asset URLs
Thumbnail and profile-image links are stored as **relative paths** (`/uploads/filename.png`), not full URLs. An earlier version baked `req.protocol + req.get('host')` into the stored link at upload time — which permanently broke the image the moment the app was viewed from a different host than the one that generated it (e.g. captured on `localhost` during development, then viewed in production). Paths now resolve against the *current* API base URL at render time instead.

### 🌓 Explicit, OS-Independent Dark Mode
Tailwind v4's default dark mode strategy follows the OS's `prefers-color-scheme` media query directly. ResuMate overrides this with `@custom-variant dark (&:where(.dark, .dark *));`, so the in-app toggle — persisted to `localStorage` — has full, independent control over the theme rather than just mirroring the system setting.

### 🛡️ Ownership-Safe Resume Mutations
`createResume` and `updateResume` strip a fixed set of restricted fields (`userId`, `isPublic`, `shareToken`, `_id`, timestamps) from every incoming request body before merging it into the document. Without this, a crafted request could reassign a resume's owner or force it publicly shared without ever calling the dedicated share endpoint.

### 🤖 Stateless AI Integration
Every Gemini-powered feature is stateless on the backend. The AI Assistant chat in particular sends the full running conversation from the client on every request; the server replays it into a fresh Gemini session rather than holding any server-side session state. Chat history currently lives only in the browser tab for the duration of the visit — see [Roadmap](#-known-limitations--roadmap).

---

## 🛠 Technology Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 19 | UI framework |
| Vite | Build tool |
| Tailwind CSS v4 | Styling, class-based dark mode |
| React Router v7 | Client-side routing |
| Axios | HTTP client |
| html2pdf.js / html2canvas | PDF export + resume thumbnail capture |
| react-hot-toast | Toast notifications |
| dayjs | Date formatting |
| lucide-react | Icons |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database |
| JWT (jsonwebtoken) | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |
| @google/generative-ai | Gemini 2.5 Flash integration |
| dotenv | Environment configuration |

---

## 📁 Project Structure

```text
resumate/
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── context/
│       │   ├── ThemeContext.jsx   # Dark/light mode, persisted
│       │   └── UserContext.jsx    # Global auth state
│       ├── components/
│       │   ├── Sidebar.jsx        # Main app navigation
│       │   ├── DashboardLayout.jsx
│       │   ├── EditResume.jsx     # Resume editor shell
│       │   ├── Forms.jsx          # All editor step forms
│       │   ├── Cards.jsx
│       │   ├── Modal.jsx
│       │   ├── ThemeSelector.jsx  # In-editor template switcher
│       │   ├── RenderResume.jsx
│       │   ├── TemplateOne.jsx … TemplateSeven.jsx
│       │   └── (Input, Tabs, MonthYearPicker, StepProgress, ResumeSection, ...)
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Templates.jsx      # Gallery + apply-to-resume flow
│       │   ├── AIAssistant.jsx    # AI chat page
│       │   ├── Settings.jsx       # Profile / password / delete account
│       │   └── PublicResume.jsx   # Read-only shared view
│       └── utils/
│           ├── apiPaths.js        # Endpoint constants + asset URL resolver
│           ├── axiosInstance.js
│           ├── helper.js          # Formatting, completion scoring, PDF capture
│           └── data.js            # Template catalog + dummy preview data
│
└── backend/
    ├── server.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── aiController.js        # Improve-with-AI, ATS score, chat
    │   ├── resumeController.js    # Resume CRUD, duplicate, share
    │   ├── uploadImages.js        # Thumbnail + profile image upload
    │   └── userController.js     # Auth, profile, password, account deletion
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── uploadMiddleware.js
    ├── models/
    │   ├── resumeModel.js
    │   └── userModel.js
    ├── routes/
    │   ├── aiRoutes.js
    │   ├── resumeRoutes.js
    │   └── userRoutes.js
    └── uploads/                   # Stored thumbnails + profile images
```

---

## ⚙️ Environment Variables

### `backend/.env`
```env
# Database
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/resumate

# Auth
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI (free tier — no credit card needed)
# Get a key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# URLs
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=4000
```

### `frontend/.env`
```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app
```
---

## 📦 Installation & Local Development

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/resumate.git
cd resumate
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env    # fill in your env values
npm run dev              # http://localhost:4000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

---

## 🔌 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register a new user | ❌ |
| POST | `/login` | Log in | ❌ |
| GET | `/profile` | Get the current user's profile | ✅ |
| PUT | `/profile` | Update name / email | ✅ |
| PUT | `/change-password` | Change password (requires current password) | ✅ |
| DELETE | `/account` | Delete account — cascades through owned resumes and files | ✅ |
| POST | `/upload-image` | Upload a standalone image | ✅ |

### Resume — `/api/resume`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create a resume | ✅ |
| GET | `/` | Get all of the user's resumes | ✅ |
| GET | `/:id` | Get a resume by ID | ✅ |
| PUT | `/:id` | Update a resume | ✅ |
| DELETE | `/:id` | Delete a resume | ✅ |
| POST | `/:id/upload-images` | Upload thumbnail + profile image | ✅ |
| POST | `/:id/duplicate` | Duplicate a resume | ✅ |
| POST | `/:id/share` | Generate a public share link | ✅ |
| DELETE | `/:id/share` | Revoke a public share link | ✅ |
| GET | `/view/:token` | View a resume via its public share link | ❌ |

### AI — `/api/ai`
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/improve-bullet` | Rewrite a work-experience bullet | ✅ |
| POST | `/improve-summary` | Rewrite the professional summary | ✅ |
| POST | `/improve-project` | Rewrite a project description | ✅ |
| POST | `/ats-score` | Get ATS compatibility score + analysis | ✅ |
| POST | `/chat` | Send a message to the AI Assistant | ✅ |

---

## 🔒 Security Features

- JWT authentication with a protected-route middleware that rejects tokens for deleted users cleanly, instead of crashing downstream
- bcrypt password hashing, minimum 6-character requirement enforced client- and server-side
- **Mass-assignment protection** on resume create/update — ownership and sharing fields are stripped from client-submitted data before merging, so a request can never hijack another user's resume or force it public
- **Cascading, confirmation-gated account deletion** — requires typing an exact confirmation phrase, then removes every owned resume and its uploaded files before deleting the account
- Public share links use a cryptographically random token and are revocable at any time, immediately invalidating the link
- CORS restricted to the configured frontend origin
- File uploads capped by size and restricted to an image MIME-type allowlist

---

## 🚧 Known Limitations & Roadmap

- **AI Assistant chat is session-only** — conversation history lives in the browser tab and resets on refresh; it is not yet persisted to the database
- **"Upgrade to Pro" is currently a visual placeholder** — there is no billing/payment integration yet
- **Resume templates intentionally stay light-mode only**, even when the rest of the app is in dark mode — they represent the printable document itself, not app UI

### Planned
- Persisted AI Assistant conversation history
- Real subscription/billing tier
- Keyword-based ATS optimization suggestions surfaced directly in the dashboard checklist

---

## 🤝 Contributing

```bash
git checkout -b feature/my-feature
git commit -m "Add new feature"
git push origin feature/my-feature
```
Then open a Pull Request describing your changes.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Soumitra Sahoo**
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://www.linkedin.com/in/soumitrasahoo)

---

## ⭐ Support

If you found this project helpful:

* ⭐ Star the repository
* 🍴 Fork the project
* 🚀 Build something awesome with it