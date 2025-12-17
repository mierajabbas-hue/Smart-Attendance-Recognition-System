# Deployment Guide - Vercel + Fly.io

This guide will help you deploy your Smart Attendance & Recognition System with:
- **Frontend** on Vercel (Free)
- **Backend** on Fly.io (Free tier)

---

## Prerequisites

1. **GitHub Account** (for connecting to Vercel)
2. **Vercel Account** - Sign up at https://vercel.com
3. **Fly.io Account** - Sign up at https://fly.io
4. **Fly CLI** installed on your machine

---

## Part 1: Deploy Backend to Fly.io

### Step 1: Install Fly CLI

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Step 2: Login to Fly.io

```bash
fly auth login
```

### Step 3: Launch the App

From your project root directory:

```bash
fly launch
```

When prompted:
- **App name**: Choose a unique name (e.g., `my-attendance-backend`)
- **Region**: Choose closest to you (e.g., `ord` for Chicago, `lhr` for London)
- **Would you like to set up a Postgresql database?**: **No**
- **Would you like to set up an Upstash Redis database?**: **No**
- **Would you like to deploy now?**: **No** (we need to set secrets first)

### Step 4: Set Environment Variables

Set your environment variables as secrets:

```bash
# Database (if using Supabase)
fly secrets set DATABASE_URL="postgresql://user:password@host:port/database"

# JWT Secret (generate a random string)
fly secrets set JWT_SECRET="your-super-secret-jwt-key-here"

# Admin credentials
fly secrets set ADMIN_USERNAME="admin"
fly secrets set ADMIN_PASSWORD="your-secure-password"

# App settings
fly secrets set DEBUG="false"
fly secrets set CORS_ORIGINS="https://your-app.vercel.app"
```

**To generate a secure JWT secret:**
```bash
openssl rand -hex 32
```

### Step 5: Create Persistent Volume (for uploads)

```bash
fly volumes create attendance_data --size 1 --region ord
```

### Step 6: Deploy

```bash
fly deploy
```

### Step 7: Get Your Backend URL

```bash
fly info
```

Your backend URL will be: `https://your-app-name.fly.dev`

Save this URL - you'll need it for the frontend!

### Useful Fly.io Commands

```bash
# View logs
fly logs

# Check status
fly status

# Open app in browser
fly open

# SSH into the machine
fly ssh console

# Scale the app
fly scale count 1

# Update secrets
fly secrets set KEY=value

# View all secrets
fly secrets list
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Project"**
3. Select your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables

In Vercel project settings, add environment variable:

- **Key**: `VITE_API_URL`
- **Value**: `https://your-app-name.fly.dev/api/v1` (your Fly.io backend URL)

### Step 4: Deploy

Click **"Deploy"** and wait for the build to complete.

Your frontend will be live at: `https://your-project.vercel.app`

### Step 5: Update CORS on Backend

Update the CORS_ORIGINS secret on Fly.io with your Vercel URL:

```bash
fly secrets set CORS_ORIGINS="https://your-project.vercel.app"
```

---

## Part 3: Post-Deployment Setup

### Update Frontend Environment Variables

If you need to update the API URL later:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `VITE_API_URL`
3. Redeploy: Go to Deployments → Click ⋯ on latest → Redeploy

### Set Up Custom Domain (Optional)

**On Vercel:**
1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

**On Fly.io:**
1. `fly certs add yourdomain.com`
2. Update DNS records as instructed

---

## Monitoring & Maintenance

### Frontend (Vercel)

- **Logs**: Vercel Dashboard → Your Project → Deployments → Click deployment → View Function Logs
- **Analytics**: Vercel Dashboard → Your Project → Analytics
- **Auto-deploys**: Every push to `main` branch triggers a new deployment

### Backend (Fly.io)

- **Logs**: `fly logs`
- **Monitoring**: https://fly.io/dashboard → Your App → Metrics
- **Auto-sleep**: Free tier apps sleep after inactivity, wake up on first request

---

## Troubleshooting

### Frontend Issues

**Build fails:**
- Check build logs in Vercel
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

**API calls failing:**
- Check `VITE_API_URL` environment variable
- Verify CORS settings on backend
- Check browser console for errors

### Backend Issues

**Deployment fails:**
- Check `fly logs`
- Verify Dockerfile builds locally: `docker build -t test .`
- Ensure all required secrets are set

**Face recognition not working:**
- Fly.io free tier has limited CPU
- Consider upgrading to a larger machine if needed: `fly scale vm shared-cpu-2x`

**Database connection issues:**
- Verify `DATABASE_URL` secret is correct
- Check database host allows connections from Fly.io IPs

---

## Cost Breakdown

### Free Tier Limits

**Vercel (Free):**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains

**Fly.io (Free):**
- ✅ Up to 3 shared-cpu-1x VMs (256MB RAM each)
- ✅ 3GB persistent storage
- ✅ 160GB outbound transfer/month
- ⚠️  Apps sleep after inactivity

### When You Might Need to Upgrade

- **High traffic**: Upgrade Fly.io VM size
- **Always-on backend**: Prevents auto-sleep ($1-2/month)
- **More storage**: For many user photos

---

## Security Checklist

- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Set DEBUG=false in production
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on both platforms)
- [ ] Restrict CORS to your frontend domain only
- [ ] Use strong admin password
- [ ] Regularly update dependencies
- [ ] Monitor logs for suspicious activity

---

## Next Steps

1. Test your deployment thoroughly
2. Set up monitoring/alerts
3. Configure backups for database
4. Set up CI/CD for automated testing
5. Add custom domain
6. Enable analytics

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Fly.io Docs**: https://fly.io/docs
- **Community**: https://community.fly.io

---

**Congratulations! Your app is now live! 🚀**

Frontend: `https://your-project.vercel.app`
Backend: `https://your-app-name.fly.dev`
