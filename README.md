# Mini Content Engine

A production-ready full-stack boilerplate foundation built with **FastAPI, SQLAlchemy, PostgreSQL, Pydantic** on the backend and **React, TypeScript, Vite, Tailwind CSS, Axios, TanStack React Query** on the frontend.

---

## 🏗️ Project Architecture & Folder Structure

```text
Mini Content Engine/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── __init__.py
│   │   │       │   └── health.py       # Health check & DB connection probe
│   │   │       ├── __init__.py
│   │   │       └── router.py          # Aggregated API v1 router
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Environment variables via pydantic-settings
│   │   │   └── database.py            # SQLAlchemy engine, session maker, Base
│   │   ├── models/                    # ORM database models
│   │   │   ├── __init__.py
│   │   │   └── base.py
│   │   ├── schemas/                   # Pydantic validation schemas
│   │   │   └── __init__.py
│   │   ├── services/                  # Business logic layer
│   │   │   └── __init__.py
│   │   ├── repositories/              # Data access repositories layer
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   └── main.py                    # FastAPI entrypoint & CORS configuration
│   ├── .env                           # Environment secrets
│   ├── .env.example                   # Template environment configuration
│   ├── Dockerfile                     # Container manifest for FastAPI app
│   └── requirements.txt               # Backend Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts              # Pre-configured Axios instance with interceptors
│   │   │   └── healthApi.ts           # Health check API caller
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx         # Navbar component
│   │   │   │   └── Footer.tsx         # Footer component
│   │   │   └── layout/
│   │   │       └── Layout.tsx         # App layout frame
│   │   ├── hooks/
│   │   │   └── useHealthCheck.ts      # React Query custom hook
│   │   ├── pages/
│   │   │   └── Home.tsx               # Foundation status dashboard page
│   │   ├── providers/
│   │   │   └── QueryProvider.tsx      # TanStack QueryClientProvider wrapper
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript interfaces
│   │   ├── App.tsx                    # Top-level React App component
│   │   ├── index.css                  # Tailwind CSS directive entry
│   │   ├── main.tsx                   # React DOM render entry point
│   │   └── vite-env.d.ts              # Vite environment types
│   ├── .env                           # Frontend environment variables
│   ├── .env.example                   # Template environment configuration
│   ├── Dockerfile                     # Container manifest (Nginx production build)
│   ├── index.html                     # HTML root page
│   ├── package.json                   # NPM dependencies and scripts
│   ├── postcss.config.js              # PostCSS plugin configuration
│   ├── tailwind.config.js             # Tailwind CSS theme configuration
│   ├── tsconfig.json                  # TypeScript compiler settings
│   ├── tsconfig.node.json             # Vite TypeScript config
│   └── vite.config.ts                 # Vite bundler configuration
│
├── docker-compose.yml                 # Multi-container orchestration (DB, API, Web)
├── .gitignore                         # Version control ignore definitions
└── README.md                          # Project documentation
```

---

## 🛠️ Stack & Key Features

### Backend
- **FastAPI**: Modern, high-performance web framework for Python 3.11+.
- **SQLAlchemy 2.0**: Powerful Object-Relational Mapper (ORM) with clean `SessionLocal` dependency injection.
- **PostgreSQL**: Production-grade relational database setup.
- **Pydantic & Pydantic-Settings**: Strict data validation and environment variable loading from `.env`.
- **CORS Middleware**: Pre-configured cross-origin request policies matching frontend URLs.
- **Modular Directory Layout**: Clear separation into `models`, `schemas`, `services`, `repositories`, and `api/v1/endpoints`.

### Frontend
- **React 18 + TypeScript**: Type-safe, component-driven UI architecture.
- **Vite**: Ultra-fast build tool and development server with instant HMR.
- **Tailwind CSS**: Utility-first CSS framework with dark theme & glassmorphism support.
- **Axios**: Pre-configured HTTP client with base URL environment resolution and error handling.
- **TanStack React Query (v5)**: Async server-state management, caching, background refetching, and query providers.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME="Mini Content Engine API"
VERSION="1.0.0"
API_V1_STR="/api/v1"

# Database Credentials
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgrespassword
POSTGRES_DB=mini_content_engine

# CORS Allowed Origins (JSON array format)
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:5173"]
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🚀 Local Development Setup

### 1. Backend Setup

```bash
# Move to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start local development server
uvicorn app.main:app --reload --port 8000
```
- API Swagger Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`

### 2. Frontend Setup

```bash
# Move to frontend directory
cd frontend

# Install node dependencies
npm install

# Run Vite dev server
npm run dev
```
- Frontend application will run at: `http://localhost:5173`

---

## 🐳 Docker Deployment

To spin up all services (PostgreSQL database, FastAPI backend, and Nginx frontend) automatically:

```bash
# From the root directory
docker-compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **PostgreSQL**: Port 5432
