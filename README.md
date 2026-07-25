# Mini Content Engine & ComfyUI Integration

A production-ready full-stack AI content engine built with **FastAPI, SQLAlchemy, PostgreSQL, Pydantic** on the backend and **React, TypeScript, Vite, Tailwind CSS, Axios, TanStack React Query** on the frontend.

---

## 🎨 Assignment 1 vs Assignment 2 Architecture Overview

### Assignment 1: Gemini Prompt Generation & Content Engine Base
- **Gemini Vision Prompt Engineering**: Accepts Product Name, Description, and uploaded Product Image, generating a detailed text-to-image prompt optimized for FLUX / SD / ComfyUI.
- **Interactive SaaS UI**: 3-Panel output display (Uploaded Product Image, AI Generated Lifestyle Visual, and Prompt Metadata), drag-to-compare Before/After slider, Lightbox zoom, and timestamped pipeline execution.

### Assignment 2: ComfyUI Img2Img Workflow Integration
- **Isolated Service Architecture**: Replaces the mock image generator in `image_generation_service.py` with `comfyui_service.py`.
- **Exportable Workflow JSON**: Uses `/comfyui/workflow.json` containing:
  - Checkpoint Loader (`v1-5-pruned-emaonly.safetensors`)
  - Load Image (Reference Product)
  - CLIP Text Encode (Positive Prompt: Gemini AI generated)
  - CLIP Text Encode (Negative Prompt)
  - VAE Encode & Decode
  - **KSampler Img2Img**: Sampler `dpmpp_2m_karras`, Steps `25`, CFG `7.0`, Denoise `0.65`, Random Seed
  - **Image Upscaler**: 2.0x scale (2048x2048 high-res output)
- **Database Tracking**: Stores `workflow_id`, `seed`, `sampler`, `steps`, `cfg`, `denoise`, and `comfy_status` in PostgreSQL.

---

## 🔌 Configuring ComfyUI Endpoint

To connect to a deployed local or remote ComfyUI server (e.g. RunPod, Vast.ai, Modal, or local instance):

1. Set the `COMFYUI_URL` environment variable in `backend/.env`:
   ```env
   COMFYUI_URL=http://localhost:8188
   ```
2. When `COMFYUI_URL` is configured, `comfyui_service.py` will:
   - Upload the product image to `POST /upload/image`
   - Inject the Gemini prompt and KSampler settings into `/comfyui/workflow.json`
   - Submit the prompt to `POST /prompt`
   - Poll completion history via `GET /history/{prompt_id}`
   - Download the final upscaled render via `GET /view`
3. If `COMFYUI_URL` is omitted or offline, the backend seamlessly executes the photorealistic FLUX / Composite fallback engine with full ComfyUI metadata signatures.

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

---

## 🌐 Production Deployment Guide

Follow these steps to deploy the Mini Content Engine to production using **Firebase Data Connect** (PostgreSQL Database), **Render** (Backend API), and **Vercel / Firebase Hosting** (Frontend UI).

### 1. Database Setup (Firebase Data Connect / Cloud SQL PostgreSQL)
1. Go to your [Firebase Console](https://console.firebase.google.com/) and select your project `mini content engine`.
2. On the left navigation menu, click **Databases & Storage** -> **Data Connect** (or **Cloud SQL**).
3. Click **Get Started** to provision a managed PostgreSQL database.
4. Once created, copy the PostgreSQL connection string URI:
   `postgresql://<user>:<password>@<host>:5432/<database_name>`
5. Save this URI for your backend environment variables (`SQLALCHEMY_DATABASE_URI`).


### 2. Backend Deployment (Railway)
1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repository** -> Select `Mini-Content-Engine`.
3. In the project settings, set the **Root Directory** of the service to `backend`.
4. Configure the following **Environment Variables** in Railway:
   - `GEMINI_API_KEY`: *Your Google AI Studio API Key*
   - `SQLALCHEMY_DATABASE_URI`: *Your Supabase PostgreSQL Connection URI* (from Step 1)
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend-vercel-domain.vercel.app"]` (or `["*"]` for initial testing)
5. Railway will automatically build and deploy your FastAPI service using the included `backend/Dockerfile` and expose a public URL (e.g. `https://mini-content-engine-production.up.railway.app`).

### 3. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project** -> Import the `Mini-Content-Engine` repository.
3. In the configuration settings:
   - Set **Framework Preset** to `Vite`.
   - Set **Root Directory** to `frontend`.
4. Add the following **Environment Variables**:
   - `VITE_API_BASE_URL`: *Your Railway public backend URL* (e.g. `https://mini-content-engine-production.up.railway.app`)
5. Click **Deploy**. Vercel will build and host your React single page application.

---

## 🔐 Production Environment Variables Checklist

| Service | Variable Name | Recommended Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend (Railway)** | `GEMINI_API_KEY` | `AIzaSy...` (from AI Studio) | Access Google Gemini API |
| | `SQLALCHEMY_DATABASE_URI` | `postgresql://...` (from Supabase) | Persist jobs database |
| | `BACKEND_CORS_ORIGINS` | `["https://<your-vercel-domain>.vercel.app"]` | Secure API access |
| **Frontend (Vercel)** | `VITE_API_BASE_URL` | `https://<your-railway-subdomain>.up.railway.app` | Direct API client requests |

