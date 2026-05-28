# VlogToBlog 🎥 ➔ 📝

**VlogToBlog** is a premium, modern full-stack web application that converts YouTube video URLs into highly structured, search-engine-optimized, and readable blog posts. It uses a Node.js backend to scrape transcripts and Google's **Gemini 1.5 Flash** AI to synthesize professional content.

---

## 🌟 Key Features
- **Caption Scraper**: Direct retrieval of timing transcripts using YouTube's internal API (No OAuth required).
- **Gemini AI Synthesis**: High-speed content generation using the latest Gemini models.
- **Interactive Workspace**: Live Markdown preview, word counts, and timestamped transcripts.
- **Customizable Output**: Choose between Tones (Casual, Technical, etc.), Formats (Tutorial, Listicle), and Lengths.
- **Firebase Integration**: Save your generated posts as drafts in a cloud-synced database.

---

## 🛠️ Local Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Firebase Account** (Free tier works perfectly)
- **Google AI Studio Key** (Get it free at [aistudio.google.com](https://aistudio.google.com/))

### 2. Backend Configuration
1. Navigate to the `backend` folder: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5001
   GEMINI_API_KEY=your_gemini_key_here
   GEMINI_MODEL=gemini-1.5-flash
   CLIENT_URL=http://localhost:5173
   TRANSCRIPT_API=sk_t2GdEtHTgIg3VvUr6tFDradfrdrytIx_Vud34ydqw
   ```
4. Start development server: `npm run dev`

### 3. Frontend Configuration
1. Navigate to the `frontend` folder: `cd ../frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   VITE_API_URL=http://localhost:5001
   ```
4. Start Vite: `npm run dev`

---

## 🚀 Free Deployment Guide

### 1. Backend (Deployment on [Render](https://render.com/))
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. **Root Directory**: `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node src/server.js`
6. **Environment Variables**: Add all keys from your backend `.env` (except PORT, Render handles it).
7. *Note: Free tier "spins down" after inactivity, so the first request might take 30-60 seconds.*

### 2. Frontend (Deployment on [Vercel](https://vercel.com/))
1. Create a new project on Vercel and connect your repo.
2. **Root Directory**: `frontend`
3. **Framework Preset**: `Vite`
4. **Environment Variables**: Add all `VITE_` keys from your frontend `.env`.
   - **Crucial**: Set `VITE_API_URL` to your new Render Backend URL (e.g., `https://vlogtoblog-api.onrender.com`).
5. Deploy!

### 3. Database (Firebase Setup)
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a project and enable **Authentication** (Google & Anonymous).
3. Enable **Realtime Database**.
4. In the `database.rules.json` (root of this repo), copy the rules and paste them into the **Rules** tab of your Firebase Realtime Database.
5. In the **Project Settings**, copy your Web App config into the frontend `.env`.

---

## 📂 Project Structure
- `/backend`: Express.js server, Gemini AI integration, and Scraper service.
- `/frontend`: React + Vite application with Glassmorphism UI.
- `firebase.json / database.rules.json`: Security rules and configuration for Firebase.

---

## 📝 License
This project is for educational and personal use. Content generated belongs to the user, but please respect YouTube's Terms of Service regarding data scraping.
