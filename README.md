# StudyConnect RESTful API Backend

StudyConnect is a secure, robust, and scalable full-stack volunteer platform connecting students with tutors. This repository contains the Node.js/Express backend API that powers the platform.

---

## 🚀 Core Components

This backend is built using a clean MVC architecture and comprises the following integrated RESTful components:

- **Authentication & Authorization** — `authController`, `authMiddleware`,`adminMiddleware`, `roleMiddleware`
- **User Profile Management** — `profileController`
- **Study Posts & Q&A** — `studyPostController`
- **Student Requests** — `studentRequestController`
- **Subject Content Management** — `subjectContentController`, `subjectContentValidation`
- **Feedback System** — `feedbackController`
- **Automated Notifications** — `notificationController`

---

## 🔌 Third-Party API Integrations

| Integration | Purpose |
|---|---|
| **Cloudinary** | Media & Document Storage |
| **Google Authentication** | Login with your google account |
| **Nodemailer** | Automated Email Delivery |
| **PurgoMalum REST API** | Automated Content Moderation |
| **Hugging Face API** | AI question-answering feature for lesson content |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB & Mongoose ORM |
| **Security** | Helmet, CORS |
| **File Uploads** | Multer |

---

## ⚙️ Setup Instructions

Follow these steps to get the backend project running locally on your machine.

### 1. Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas URI)
- Git

### 2. Clone the Repository

```bash
git clone https://github.com/Adeesha-Sandaruwan/StudyConnect
cd StudyConnect
```

### 3. Install Dependencies

Navigate into the `server` directory and install the required NPM packages:

```bash
cd server
npm install
```

### 4. Environment Variables Configuration

Create a `.env` file in the root of your `server` directory. Copy the structure below and replace all placeholder values with your actual credentials:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer (Email Automation)
EMAIL_USER=your_verified_gmail_address
EMAIL_PASS=your_16_character_app_password
```

### 5. Start the Server

Run the application in development mode:

```bash
npm run dev
```

If configured correctly, your terminal will display:

```
Server started on port 5000
MongoDB Connected...
```

You can now send requests to `http://localhost:5000`.