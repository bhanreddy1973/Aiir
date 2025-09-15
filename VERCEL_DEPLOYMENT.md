# 🚀 Complete Vercel Deployment Guide for Aiiir

## Prerequisites
- GitHub account with your Aiiir repository
- Vercel account (free tier available)
- Backend deployed on Railway/Render (we'll cover this)

## Step 1: Deploy Backend (Railway - Recommended)

### 1.1 Setup Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your repository

### 1.2 Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# In your project root directory
cd backend
railway init
railway up
```

### 1.3 Set Environment Variables in Railway
Go to Railway dashboard → Your project → Variables and add:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/aiiir
GENERATIVE_API_KEY=your_google_gemini_api_key
EMAIL=your_email@gmail.com
PASSWORD=your_app_password
AWS_BUCKET_NAME=your_s3_bucket
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET=your_aws_secret_key
PORT=5000
```

### 1.4 Get Backend URL
- After deployment, Railway will provide a URL like: `https://your-app.railway.app`
- Copy this URL for frontend configuration

## Step 2: Deploy Frontend to Vercel

### 2.1 Method A: GitHub Integration (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository `bhanreddy1973/Aiir`

2. **Configure Project Settings**
   - Framework Preset: "Create React App"
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend.railway.app`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### 2.2 Method B: CLI Deployment

```bash
# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - What's your project's name? aiiir-frontend
# - In which directory is your code located? ./
```

## Step 3: Configure API URLs

### 3.1 Update Frontend API Configuration
The frontend should automatically use environment variables. If needed, update:

```javascript
// In your API configuration file
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 3.2 Update Backend CORS
In your backend, update CORS to allow Vercel domain:

```javascript
// backend/index.js
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain in Vercel
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain name
3. Configure DNS records as shown

### 4.2 Update Backend CORS with New Domain
Add your custom domain to the CORS origins list

## Step 5: Environment Setup Checklist

### ✅ Backend (Railway)
- [ ] MongoDB Atlas connection working
- [ ] Google Gemini API key configured
- [ ] AWS S3 credentials set
- [ ] Email SMTP configured
- [ ] All environment variables set
- [ ] Health check endpoint responding

### ✅ Frontend (Vercel)
- [ ] Build completes successfully
- [ ] API URL environment variable set
- [ ] All routes working (SPA routing)
- [ ] Static assets loading
- [ ] Real-time features working

## Step 6: Testing Deployment

### 6.1 Test Backend
```bash
curl https://your-backend.railway.app/health
```

### 6.2 Test Frontend
1. Visit your Vercel URL
2. Test user registration
3. Test login functionality
4. Test real-time messaging
5. Test file uploads
6. Test AI chatbot

## Common Issues & Solutions

### Issue: Build Fails
**Solution**: Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Check for TypeScript errors
- Verify build command is correct

### Issue: API Calls Fail
**Solution**: Check network tab in browser
- Verify REACT_APP_API_URL is set correctly
- Check CORS configuration in backend
- Ensure backend is deployed and running

### Issue: Real-time Features Not Working
**Solution**: Check Socket.IO configuration
- Verify WebSocket connections
- Check if backend supports WebSocket
- Update Socket.IO configuration for production

## Deployment Commands Summary

```bash
# Install tools
npm install -g vercel @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up

# Deploy frontend
cd ../frontend
vercel login
vercel --prod
```

## Production URLs
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.railway.app`
- **Repository**: `https://github.com/bhanreddy1973/Aiir`

## Support
If you encounter issues:
1. Check Vercel deployment logs
2. Check Railway application logs
3. Verify all environment variables
4. Test API endpoints individually
5. Check browser console for errors