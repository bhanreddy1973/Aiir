# Aiiir Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel + Railway (Recommended)
**Frontend: Vercel | Backend: Railway**

#### Frontend Deployment (Vercel)
1. Push your code to GitHub
2. Connect Vercel to your GitHub repository
3. Deploy with these settings:
   - Framework Preset: Create React App
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: build

#### Backend Deployment (Railway)
1. Connect Railway to your GitHub repository
2. Deploy with these settings:
   - Root Directory: backend
   - Start Command: npm start
   - Add environment variables from .env.example

### Option 2: Netlify + Heroku
**Frontend: Netlify | Backend: Heroku**

#### Frontend Deployment (Netlify)
1. Drag and drop the frontend/build folder to Netlify
2. Or connect to GitHub and set:
   - Base directory: frontend
   - Build command: npm run build
   - Publish directory: frontend/build

#### Backend Deployment (Heroku)
1. Install Heroku CLI
2. Create Heroku app: `heroku create aiiir-backend`
3. Set environment variables: `heroku config:set VARIABLE=value`
4. Deploy: `git subtree push --prefix backend heroku main`

### Option 3: Docker Deployment

#### Build Docker Images
```bash
# Backend
docker build -t aiiir-backend ./backend

# Frontend  
docker build -t aiiir-frontend ./frontend
```

#### Run with Docker Compose
```bash
docker-compose up -d
```

## 🔧 Environment Variables Required

### Backend (.env)
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

### Frontend
- No additional environment variables required
- Backend URL is automatically configured

## ⚡ Quick Deploy Commands

### Railway (Backend)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Vercel (Frontend)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

## 📊 Performance Optimization

### Backend
- Enable CORS for your frontend domain
- Set up MongoDB Atlas with proper indexes
- Configure AWS S3 with CDN (CloudFront)
- Use PM2 for process management in production

### Frontend
- Build is already optimized
- Enable gzip compression on server
- Use CDN for static assets
- Configure caching headers

## 🔒 Security Checklist

- [ ] All environment variables configured
- [ ] CORS properly configured for your domain
- [ ] Database connection secured
- [ ] API keys kept secret
- [ ] HTTPS enabled
- [ ] File upload validation enabled

## 🌐 Domain Configuration

1. Point your domain to deployment platforms
2. Update CORS settings in backend
3. Configure SSL certificates
4. Test all functionality

## 📈 Monitoring

- Set up logging for backend
- Monitor database performance
- Track API response times
- Set up error reporting (Sentry recommended)