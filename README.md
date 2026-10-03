# Linkly — Link Shortener with Analytics Dashboard

A modern, full-stack SaaS Link Shortener and Analytics platform built with NestJS, PostgreSQL, TypeORM, Next.js, and Zustand.

---

## 🏗️ Production Architecture

```text
┌────────────────────────────────────────────────────────┐
│                        Browser                         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Vercel (Frontend)                     │
│                  Next.js + Zustand                     │
└───────────────────────────┬────────────────────────────┘
                            │  REST API (HTTPS)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Render (Backend)                     │
│             NestJS API (Node 22 Container)             │
└───────────────────────────┬────────────────────────────┘
                            │  PostgreSQL + SSL
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Neon (Database Service)                │
│                 Serverless PostgreSQL                  │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20 or v22
- **Docker & Docker Compose** (for local PostgreSQL database)

### 2. Start Local PostgreSQL Database
```bash
docker-compose up -d
```
This runs PostgreSQL 17 locally on `localhost:5433` (mapped to container port 5432).

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```
Backend will start on `http://localhost:3000`.

### 4. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Frontend will start on `http://localhost:3001`.

---

## 🔑 Environment Variables Reference

### Backend Environment Variables (`backend/.env`)

| Variable | Description | Local Value | Production Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_HOST` | PostgreSQL Hostname | `localhost` | `ep-xxx.neon.tech` |
| `DATABASE_PORT` | PostgreSQL Port | `5433` | `5432` |
| `DATABASE_USER` | PostgreSQL Username | `postgres` | `neondb_owner` |
| `DATABASE_PASSWORD` | PostgreSQL Password | `postgres` | `<secure-neon-password>` |
| `DATABASE_NAME` | Database Name | `link_shortener` | `neondb` |
| `DATABASE_SSL` | Enable SSL for Neon DB | `false` | `true` |
| `JWT_SECRET` | Secret key for signing JWTs | `local-dev-secret` | `<32+-char-random-string>` |
| `JWT_EXPIRES_IN` | Token Expiry Duration | `1d` | `1d` |
| `FRONTEND_URL` | Allowed CORS Origins | `http://localhost:3001` | `https://your-app.vercel.app` |
| `PORT` | HTTP Server Port | `3000` | `10000` (Assigned by Render) |
| `NODE_ENV` | Runtime Mode | `development` | `production` |

### Frontend Environment Variables (`frontend/.env.local`)

| Variable | Description | Local Value | Production Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base API Endpoint for NestJS | `http://localhost:3000` | `https://your-api.onrender.com` |
| `NEXT_PUBLIC_SHORT_URL` | Short URL Base Path | `http://localhost:3000` | `https://your-api.onrender.com` |

> ⚠️ **Security Warning:** Never expose `JWT_SECRET`, database passwords, or server credentials in `NEXT_PUBLIC_*` environment variables.

---

## 🗄️ Database Migrations (TypeORM)

In production, database schemas are managed strictly via TypeORM migrations (`synchronize: false`).

### Migration Commands (run from `backend/`):

```bash
# Generate a new migration based on entity changes
npm run migration:generate -- src/database/migrations/YourMigrationName

# Apply pending migrations to the active database
npm run migration:run

# Revert the last applied migration
npm run migration:revert
```

---

## 🚀 Deployment Guide

### 1. Database Setup (Neon PostgreSQL)
1. Sign up at [Neon.tech](https://neon.tech) and create a new project.
2. Copy your connection details: `Host`, `Database`, `Username`, `Password`, and `Port` (`5432`).
3. Ensure `DATABASE_SSL=true` is enabled in your backend production environment.

### 2. Backend Deployment (Render Web Service)
1. Log in to [Render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (using `Dockerfile`) or `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run migration:run && npm run start:prod`
4. Add the **Environment Variables** in Render Dashboard:
   - `DATABASE_HOST` = `<neon-hostname>`
   - `DATABASE_USER` = `<neon-user>`
   - `DATABASE_PASSWORD` = `<neon-password>`
   - `DATABASE_NAME` = `<neon-dbname>`
   - `DATABASE_SSL` = `true`
   - `JWT_SECRET` = `<generate-with-crypto-randomBytes>`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `NODE_ENV` = `production`
5. Deploy service and verify status at `https://your-api.onrender.com/health`.

### 3. Frontend Deployment (Vercel)
1. Log in to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://your-api.onrender.com`
   - `NEXT_PUBLIC_SHORT_URL` = `https://your-api.onrender.com`
5. Click **Deploy**.

---

## 🩺 Production Health Check

Verify API availability by requesting:

```http
GET https://your-api.onrender.com/health
```

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "timestamp": "2026-10-03T09:00:00.000Z"
}
```

---

## 📋 Production Deployment Checklist

- [x] Git repository configured with root `.git`
- [x] Sensitive `.env` files excluded from Git tracking
- [x] `.env.example` templates created for backend & frontend
- [x] Production database provisioned on Neon with SSL enabled
- [x] Database migrations configured (`synchronize: false`)
- [x] NestJS configured for `0.0.0.0` binding & dynamic port mapping
- [x] Multi-stage production `Dockerfile` created
- [x] Backend deployed to Render with migration startup step
- [x] `/health` endpoint verified on production API
- [x] Frontend deployed to Vercel
- [x] `NEXT_PUBLIC_API_URL` pointed to Render API
- [x] CORS restricted to Vercel production domain
- [x] End-to-end flow verified (Register → Login → Create Link → Redirect → Analytics)
