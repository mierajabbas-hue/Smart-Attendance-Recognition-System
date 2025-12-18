# Quick Connection Guide

## ✅ Backend Deployed!

**Backend URL:** `https://smart-attendance-backend-green-glade-4681.fly.dev`

---

## 🔗 Connect Frontend to Backend

### Step 1: Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Find or add `VITE_API_URL`
5. Set value to: `https://smart-attendance-backend.fly.dev/api/v1`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **⋯** on latest deployment → **Redeploy**

### Step 2: Set CORS on Backend

Replace `YOUR-VERCEL-URL` with your actual URL:

```bash
fly secrets set CORS_ORIGINS='["https://YOUR-VERCEL-URL.vercel.app"]' -a smart-attendance-backend
```

### Step 3: Test the Connection

Open your frontend and try to login!

---

## 🔍 Troubleshooting

**Check backend health:**
```
https://smart-attendance-backend.fly.dev/health
```

**View backend logs:**
```bash
fly logs -a smart-attendance-backend
```

**Check backend status:**
```bash
fly status -a smart-attendance-backend
```

---

## 📝 URLs Summary

- **Frontend:** https://your-app.vercel.app
- **Backend:** https://smart-attendance-backend.fly.dev
- **Backend API:** https://smart-attendance-backend.fly.dev/api/v1
- **Health Check:** https://smart-attendance-backend.fly.dev/health
