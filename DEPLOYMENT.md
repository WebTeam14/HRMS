# Deployment Guide — HRMS Application

This project is configured for deployment with **Frontend on Vercel** and **Backend on Render**.

---

## 🚀 Part 1: Deploy Backend to Render

### 1. MongoDB Database Setup
Ensure you have a MongoDB Atlas connection string (or managed MongoDB URI):
`mongodb+srv://<username>:<password>@cluster0.mongodb.net/hrms?retryWrites=true&w=majority`

### 2. Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your Git repository (`hrms`).
3. Fill in the following settings:
   - **Name**: `hrms-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your MongoDB connection string*
   - `JWT_ACCESS_SECRET`: *A secure random string*
   - `JWT_REFRESH_SECRET`: *A secure random string*
   - `CLIENT_URL`: `https://your-app-name.vercel.app` *(Replace with your actual Vercel domain)*
5. Click **Create Web Service**.
6. Copy your deployed backend API URL (e.g. `https://hrms-backend.onrender.com`).

---

## ⚡ Part 2: Deploy Frontend to Vercel

### 1. Import Repository on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. Import your Git repository (`hrms`).

### 2. Project Build Settings
Configure project settings on Vercel:
- **Framework Preset**: `Vite`
- **Root Directory**: `client` *(Click Edit and select the `client` folder)*
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3. Set Environment Variable
In the **Environment Variables** section on Vercel, add:
- `VITE_API_URL`: `https://hrms-backend.onrender.com/api` *(Use your Render backend URL)*

### 4. Deploy
Click **Deploy**. Vercel will build and launch your application.

---

## ✅ Post-Deployment Checklist

1. Update `CLIENT_URL` on Render to match your live Vercel domain (e.g. `https://hrms-app.vercel.app`).
2. Open your Vercel URL and test login/register functionality.
3. Health Check: Visit `https://your-backend.onrender.com/api/health` to confirm backend readiness.
