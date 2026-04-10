<div align="center">

<br/>

<h1>📚 StudyConnect</h1>

### 🎓 A Full-Stack Collaborative Learning Platform

<br/>

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

<br/>

[🚀 Live Demo](#-live-deployment) · [📖 API Docs](#-api-documentation) · [🧪 Testing](#-testing) · [🤝 Contributing](#-contributing)

<br/>

---

</div>

<br/>

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Live Deployment](#-live-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)

<br/>

---

## 🌟 Overview

**StudyConnect** is a full-stack collaborative learning platform that empowers students to connect, share knowledge, and grow together. Built with a modern MERN-inspired architecture, it features secure authentication, media uploads, real-time study post feeds, and a robust testing suite covering unit, integration, and performance layers.

<br/>

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite, Vitest |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (HTTP-only cookies), Google OAuth 2.0 |
| **Media** | Cloudinary |
| **Email** | Nodemailer + Gmail SMTP |
| **Testing** | Vitest, Supertest, Artillery.io |
| **Deployment** | Vercel (Frontend), Render/Railway (Backend) |

<br/>

---

## 📁 Project Structure

```
StudyConnect/
├── frontend/                   # React + Vite application
│   ├── src/
│   └── .env                    # Frontend environment variables
│
├── server/                     # Express.js backend
│   ├── tests/
│   │   ├── *.unit.test.js      # Unit tests
│   │   └── *.integration*.test.js  # Integration tests
│   └── .env                    # Backend environment variables
│
├── tests/
│   └── StudyConnect_Postman_Collection.json  # Full Postman collection
│
└── performance-test.yml        # Artillery load test config
```

<br/>

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** `v18+` — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)
- **MongoDB Atlas** account — [Sign Up](https://www.mongodb.com/atlas) *(or a local MongoDB instance)*

<br/>

### 1. Clone the Repository

```bash
git clone https://github.com/Adeesha-Sandaruwan/StudyConnect.git
cd StudyConnect
```

<br/>

### 2. Backend Setup

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create your environment file (see Environment Variables section below)
touch .env

# Start the development server
npm run dev
```

> The backend will start on `http://localhost:5000`

<br/>

### 3. Frontend Setup

```bash
# Navigate to the frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create your environment file (see Environment Variables section below)
touch .env

# Start the development server
npm run dev
```

> The frontend will start on `http://localhost:5173`

<br/>

---

## 🔐 Environment Variables

### Backend — `server/.env`

```env
# ── Server ─────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── Database ───────────────────────────────────────────
MONGO_URI=your_mongodb_connection_string

# ── Authentication ─────────────────────────────────────
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# ── Cloudinary (Media Storage) ─────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ── Email / SMTP ───────────────────────────────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_smtp_email@gmail.com
SMTP_PASSWORD=your_smtp_app_password
FROM_NAME="StudyConnect Security"
FROM_EMAIL=your_smtp_email@gmail.com

# ── CORS ───────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

> ⚠️ **Security Notice:** Never commit `.env` files to version control. All secret values in production are stored securely in the hosting provider's environment settings.

<br/>

---

## 📡 API Documentation

> 💡 **Tip:** A complete, ready-to-import **Postman Collection** is available at:
> ```
> /tests/StudyConnect_Postman_Collection.json
> ```
> Import it directly into Postman to access all endpoints with pre-configured headers and example request bodies.

<br/>

### 🔑 Authentication — `/api/users`

<br/>

#### `POST /api/users/register(Example)`
Registers a new user account.

| Property | Value |
|---|---|
| **Auth Required** | ❌ No |
| **Success Status** | `201 Created` |

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Success Response:**
```json
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "student"
}
```

<br/>

#### `POST /api/users/login`
Authenticates a user and sets an HTTP-only JWT cookie.

| Property | Value |
|---|---|
| **Auth Required** | ❌ No |
| **Success Status** | `200 OK` |

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response:** User object + `Set-Cookie` header with JWT.

<br/>

---

## ☁️ Live Deployment

| Service | Provider | URL |
|---|---|---|
| **Frontend** | Vercel / Netlify | `https://your-frontend-url.vercel.app` |
| **Backend API** | Render / Railway | `https://your-backend-url.onrender.com` |
| **Database** | MongoDB Atlas | Managed Cloud |

<br/>

**Production Environment Variables:**

- **Backend:** `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `FROM_NAME`, `FROM_EMAIL`, `FRONTEND_URL`
- **Frontend:** `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`

<br/>

### Deployment Report (April 2026)

| Item | Status | Notes |
|---|---|---|
| **Frontend Deployment** | ✅ Completed | Vercel: `https://studyconnectdeploy-ni3kg0ngs-adeesha-sandaruwans-projects.vercel.app` |
| **Backend Deployment** | ✅ Completed | Render: `https://studyconnect-3v1n.onrender.com` |
| **Database** | ✅ Connected | MongoDB Atlas used in production |
| **CORS Configuration** | ✅ Updated | Backend now uses `FRONTEND_URL` with localhost fallback for development |
| **Frontend API Base URL** | ✅ Updated | `VITE_API_BASE_URL=https://studyconnect-3v1n.onrender.com/api` |

**Post-Deployment Validation Checklist:**

- `GET /api/users/me` responds from frontend without CORS errors
- Register and login flows work in production
- Google login preflight request succeeds
- Protected routes redirect unauthenticated users correctly
- Render service is reachable after idle spin-up

<br/>

---

## 🧪 Testing

StudyConnect features a comprehensive three-layer testing strategy to ensure reliability, correctness, and performance at scale.

<br/>

### Testing Stack

| Layer | Tool | Scope |
|---|---|---|
| **Unit** | Vitest | Components, utilities, controller logic |
| **Integration** | Vitest + Supertest | Express routes ↔ MongoDB |
| **Performance** | Artillery.io | Concurrent load & stress testing |

<br/>

### ▶️ Running Unit Tests

**Frontend** *(React components & utilities)*:
```bash
cd frontend
npx vitest run
```

**Backend** *(controllers & utility functions)*:
```bash
cd server
npx vitest run tests/*.unit.test.js
```

<br/>

### 🔗 Running Integration Tests

Integration tests verify full request-response cycles between Express controllers, routing, and MongoDB.

```bash
cd server
# Ensure MONGO_URI is set in your .env file
npx vitest run tests/*.integration*.test.js
```

<br/>

### ⚡ Running Performance Tests

Artillery simulates concurrent user loads to measure latency, throughput, and stability.

```bash
# Step 1 — Install Artillery globally
npm install -g artillery

# Step 2 — Start the backend server
cd server && npm run dev

# Step 3 — In a new terminal at the project root, run the load test
artillery run performance-test.yml
```

The final report will display **median latency**, **p95 response times**, and **HTTP 200 success rates**.

<br/>

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**

<br/>

---

<div align="center">

Made with ❤️ by the **StudyConnect Team**

<br/>

⭐ *If you found this project helpful, consider giving it a star!* ⭐

</div>
