<p align="center">
  <h1 align="center">🎙️ PaperCast</h1>
  <p align="center">
    <strong>Turn research papers into engaging podcast episodes — powered by AI.</strong>
  </p>
  <p align="center">
    Upload a PDF or search arXiv, configure your podcast style, and listen to a two-host AI-generated conversation in minutes.
  </p>
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| **📄 PDF Upload** | Drag-and-drop or browse to upload any research paper PDF |
| **🔍 Paper Search** | Search arXiv and Semantic Scholar directly from the app |
| **🤖 AI Script Generation** | Converts papers into natural two-host podcast dialogues using Groq (LLaMA 3.3 70B) |
| **⚙️ Configurable Podcasts** | Choose audience level, episode length, conversation style, focus areas, and more |
| **✏️ Script Editor** | Review and fine-tune the generated script before audio synthesis |
| **🔊 Text-to-Speech** | High-quality, free audio generation via Microsoft Edge TTS with dual voices |
| **🎧 Built-in Audio Player** | Listen to your generated podcast episodes with chapter navigation |
| **⚔️ Debate Score** | Upload two papers and get an AI-powered opposition analysis with detailed scoring |
| **🔄 Custom Transformations** | Create reusable prompt templates to change how the AI generates scripts |
| **📊 PDF Summary** | Get quick AI-generated summaries of uploaded papers |
| **🌗 Dark / Light Theme** | Toggle between dark and light modes |
| **🔐 Authentication** | User sign-in via Supabase (Google OAuth supported) |

---

## 🖼️ App Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Upload /   │───▶│  Configure   │───▶│    Edit      │───▶│   Listen     │
│   Search     │    │  Podcast     │    │   Script     │    │   Episode    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐    ┌──────────────┐
│ Debate Score │    │Transformations│
│  (Compare 2  │    │  (Custom     │
│   papers)    │    │   prompts)   │
└──────────────┘    └──────────────┘
```

---

## 🏗️ Tech Stack

### Frontend
- **React 19** + **TypeScript** — Component-based UI
- **Vite 7** — Lightning-fast dev server and build tool
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Smooth animations and transitions
- **React Router 7** — Client-side routing
- **Lucide React** — Beautiful icon library
- **Supabase JS** — Auth and database client

### Backend
- **Node.js** + **Express 5** — RESTful API server (ES Modules)
- **Groq SDK** — LLM inference (LLaMA 3.3 70B Versatile)
- **Edge TTS (Node)** — Free Microsoft Edge text-to-speech
- **Fluent FFmpeg** + **ffmpeg-static** — Audio merging and processing
- **pdf-parse** — PDF text extraction
- **fast-xml-parser** — arXiv API response parsing
- **Multer** — Multipart file upload handling
- **Supabase JS** — Session management and storage

---

## 📁 Project Structure

```
PaperCast/
├── .env                          # Root environment variables
├── .gitignore
├── backend/
│   ├── index.js                  # Express server entry point + paper search API
│   ├── package.json
│   ├── routes/
│   │   ├── upload.js             # PDF upload endpoint
│   │   ├── generate.js           # AI script generation + playground
│   │   ├── audio.js              # TTS audio generation + merging
│   │   ├── fetchPdf.js           # Proxy endpoint for fetching remote PDFs
│   │   ├── debateScore.js        # Two-paper opposition analysis
│   │   ├── pdfSummary.js         # AI-powered PDF summarisation
│   │   └── transformations.js    # CRUD for custom transformation prompts
│   ├── services/
│   │   ├── groqService.js        # Groq LLM client + podcast script prompt
│   │   ├── edgeTtsService.js     # Edge TTS audio generation
│   │   ├── audioMerger.js        # FFmpeg audio concatenation
│   │   ├── pdfExtractor.js       # PDF-to-text extraction
│   │   └── supabaseClient.js     # Supabase client initialisation
│   └── temp/                     # Temporary audio files (gitignored)
│
├── frontend/
│   ├── index.html                # App shell
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Root component + routing
│       ├── index.css             # Global styles
│       ├── App.css
│       ├── pages/
│       │   ├── Home.tsx          # Upload / search landing page
│       │   ├── Configure.tsx     # Podcast settings (audience, length, style)
│       │   ├── ScriptEditor.tsx  # Review & edit generated dialogue
│       │   ├── Listen.tsx        # Audio player with chapters
│       │   ├── DebateScore.tsx   # Two-paper comparison dashboard
│       │   └── Transformations.tsx # Manage custom prompt templates
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── UploadZone.tsx
│       │   ├── PaperSearch.tsx
│       │   ├── AudioPlayer.tsx
│       │   ├── DialogueCard.tsx
│       │   ├── ChapterPill.tsx
│       │   ├── StepIndicator.tsx
│       │   ├── SignInModal.tsx
│       │   ├── TransformationCard.tsx
│       │   └── TransformationModal.tsx
│       ├── context/
│       │   ├── AppContext.tsx     # Global app state (PDF text, script, config)
│       │   ├── AuthContext.tsx    # Supabase auth state
│       │   └── ThemeContext.tsx   # Dark / light theme toggle
│       ├── lib/
│       │   └── supabase.ts       # Frontend Supabase client
│       └── data/
│           └── transformations.ts # Default transformation presets
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | >= 18.x |
| **npm** | >= 9.x |
| **FFmpeg** | Bundled via `ffmpeg-static` (no manual install needed) |

### 1. Clone the Repository

```bash
git clone https://github.com/kurellynandu-007/PaperCast.git
cd PaperCast
```

### 2. Configure Environment Variables

Create a **`.env`** file in the project **root** directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

Create a **`frontend/.env`** file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Where to get API keys:**
> - **Supabase**: Create a free project at [supabase.com](https://supabase.com) → Settings → API
> - **Groq**: Get a free API key at [console.groq.com](https://console.groq.com)

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start the Application

Open two terminals:

```bash
# Terminal 1 — Backend (runs on http://localhost:3000)
cd backend
node index.js

# Terminal 2 — Frontend (runs on http://localhost:5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser and start turning papers into podcasts! 🎉

---

## 📖 Usage Guide

### 🎙️ Generate a Podcast

1. **Upload or Search** — Drop a PDF on the home page, or search for a paper by keyword on arXiv / Semantic Scholar.
2. **Configure** — Pick the audience level (*beginner / intermediate / expert*), episode length (*short / medium / deep-dive*), conversation style, and optional focus areas.
3. **Edit Script** — Review the AI-generated two-host dialogue. Edit any line, add or remove turns.
4. **Listen** — Hit generate audio. The app synthesises speech with two distinct voices (Alex & Sam) and plays the final episode with chapter navigation.

### ⚔️ Debate Score

1. Navigate to the **Debate Score** page.
2. Upload **two research paper PDFs**.
3. The AI analyses both papers and returns:
   - An **overall opposition score** (0–100)
   - A **breakdown** by conclusions, methodology, findings, and recommendations
   - Specific **opposing points** between the two papers
   - A concise **summary**

### 🔄 Custom Transformations

1. Go to the **Transformations** page.
2. Create a new transformation with a custom system prompt.
3. When generating a podcast, select your transformation to change the AI's generation style (e.g., "Make it humorous", "Focus on methodology critique", etc.).

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/paper-search?query=...` | Search papers (arXiv → Semantic Scholar fallback) |
| `POST` | `/api/upload` | Upload PDF, returns extracted text |
| `POST` | `/api/generate` | Generate podcast script from PDF text + config |
| `POST` | `/api/generate/playground` | Test transformation prompts |
| `POST` | `/api/audio` | Generate TTS audio from script |
| `GET` | `/api/audio/play/:sessionId/:file` | Stream generated audio files |
| `POST` | `/api/fetch-pdf` | Fetch a remote PDF by URL |
| `POST` | `/api/debate-score` | Compare two PDFs for opposition analysis |
| `POST` | `/api/pdf-summary` | Generate a summary of a PDF |
| `GET` | `/api/transformations` | List custom transformations |
| `POST` | `/api/transformations` | Create a new transformation |
| `PUT` | `/api/transformations/:name` | Update a transformation |
| `DELETE` | `/api/transformations/:name` | Delete a transformation |

---

## 🎤 Voice Configuration

PaperCast uses **Microsoft Edge TTS** for free, high-quality speech synthesis:

| Host | Voice ID | Character |
|---|---|---|
| **Alex** | `en-US-GuyNeural` | Deep male voice — the Explainer |
| **Sam** | `en-US-JennyNeural` | Warm female voice — the Questioner |

---

## 📏 Episode Length Specs

| Length | Word Count | Dialogue Turns | Duration | Max Tokens |
|---|---|---|---|---|
| **Short** | 800 – 1,200 | 10 – 15 | 5 – 8 min | 4,096 |
| **Medium** | 2,000 – 3,000 | 25 – 35 | 12 – 18 min | 8,192 |
| **Deep Dive** | 4,000 – 5,500 | 45 – 60 | 25 – 40 min | 8,192 |

---

## 🛡️ Environment Variables Reference

| Variable | Location | Required | Description |
|---|---|---|---|
| `SUPABASE_URL` | Root `.env` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Root `.env` | Yes | Supabase anonymous key |
| `GROQ_API_KEY` | Root `.env` | Yes | Groq API key for LLM inference |
| `PORT` | Root `.env` | No | Backend port (default: `3000`) |
| `VITE_SUPABASE_URL` | `frontend/.env` | Yes | Supabase project URL (frontend) |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` | Yes | Supabase anonymous key (frontend) |

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/kurellynandu-007">kurellynandu-007</a>
</p>
