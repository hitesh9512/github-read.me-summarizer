# RepoSummarizer 🔍

An AI-powered full-stack web app that generates comprehensive summaries of any GitHub repository using the **Groq API**.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (bcrypt passwords) |
| AI | Groq (OpenAI-compatible Chat Completions) |
| GitHub | GitHub REST API |
| Frontend | React 18, Vite, Tailwind CSS v3 |

## Features

- 🤖 **AI Summaries** — Overview, Key Features, Tech Stack, Use Cases, Beginner & Technical explanations
- 🔐 **JWT Authentication** — Signup/Login with protected routes
- 💾 **Caching** — Per-user DB cache; no repeated Groq calls for same repo
- 🔗 **URL-first Summaries** — Sends repository URL directly to the model
- 📋 **Copy to Clipboard** — Copy the full summary as Markdown
- 📄 **PDF Download** — Export the summary page as a PDF
- ⚡ **Rate Limiting** — 20 summary requests per 15 minutes per user
- 📱 **Responsive** — Mobile-friendly dark UI with glassmorphism

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a hosted URL from Supabase/Neon/Railway)
- Groq API key from [Groq Console](https://console.groq.com/keys)
- GitHub Personal Access Token (optional, avoids rate limits)

### 1. Clone & Install

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/github_summarizer"
JWT_SECRET="your-random-secret-here"
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama-3.1-8b-instant"
GITHUB_TOKEN="ghp_your_token"   # optional
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Run the app

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/summary` | ✅ | Generate summary (or return cached) |
| GET | `/api/summary/history` | ✅ | List all user summaries |
| GET | `/api/summary/:id` | ✅ | Get a single summary |
| DELETE | `/api/summary/:id` | ✅ | Delete a summary |
| GET | `/api/health` | — | Health check |

## Project Structure

```
proj-1/
├── backend/
│   ├── prisma/schema.prisma     # DB schema
│   ├── src/
│   │   ├── index.js             # Express app
│   │   ├── routes/              # auth + summary routes
│   │   ├── controllers/         # business logic
│   │   ├── services/            # groq API integration
│   │   └── middleware/          # JWT auth + rate limiting
│   └── .env.example
└── frontend/
    └── src/
        ├── api/client.js        # Axios + API helpers
        ├── context/AuthContext  # Global auth state
        ├── components/          # Navbar, Spinner, ProtectedRoute
        └── pages/               # Home, Login, Signup, Results, Dashboard
```
