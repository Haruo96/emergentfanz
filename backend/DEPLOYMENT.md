# Deployment Guide - ContentVault Platform

This guide provides step-by-step instructions for deploying the ContentVault platform to production.

## 🚀 Quick Deployment Checklist

### Pre-Deployment
- [ ] Set up MongoDB Atlas database
- [ ] Configure environment variables
- [ ] Test payment integration
- [ ] Set up file storage (S3/R2)
- [ ] Configure domain and SSL

### Backend Deployment
- [ ] Deploy to Render/Heroku/DigitalOcean
- [ ] Configure production environment
- [ ] Set up monitoring and logging

### Frontend Deployment
- [ ] Update API endpoints
- [ ] Deploy to Vercel/Netlify
- [ ] Configure CORS settings

## 📊 Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Account
```bash
# Visit https://www.mongodb.com/atlas
# Create free account and new cluster
```

### 2. Configure Database
```javascript
// Create database: content-platform
// Collections will be created automatically by Mongoose
```

### 3. Get Connection String
```env
# Example connection string:
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/content-platform?retryWrites=true&w=majority
```

### 4. Set Up Database Indexes (Optional but Recommended)
```javascript
// Connect to your database and run:
db.posts.createIndex({ creatorId: 1, createdAt: -1 })
db.posts.createIndex({ isPublic: 1, createdAt: -1 })
db.subscriptions.createIndex({ fanId: 1, creatorId: 1 }, { unique: true })
db.subscriptions.createIndex({ endDate: 1, paymentStatus: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
```

## 🖥 Backend Deployment

### Option 1: Render (Recommended)

#### 1. Prepare for Deployment
```bash
# Ensure package.json has correct start script
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### 2. Deploy to Render
1. Visit [render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18 or higher

#### 3. Environment Variables on Render
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/content-platform
JWT_SECRET=your-super-secure-production-jwt-secret-min-32-chars
PORT=5000
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Option 2: Heroku

#### 1. Install Heroku CLI
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login
```

#### 2. Create Heroku App
```bash
# In your backend directory
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/content-platform"
heroku config:set JWT_SECRET="your-super-secure-production-jwt-secret"
heroku config:set FRONTEND_URL="https://your-frontend-domain.com"
```

#### 3. Deploy
```bash
# Deploy to Heroku
git add .
git commit -m "Deploy to production"
git push heroku main
```

### Option 3: DigitalOcean App Platform

#### 1. Create App
1. Visit [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Create new app from GitHub repository
3. Configure build and run commands

#### 2. Environment Variables
Set the same environment variables as listed above in the DigitalOcean dashboard.

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

#### 1. Update API Configuration
```javascript
// In frontend/script.js, update the API URL:
const API_BASE_URL = 'https://your-backend-app.onrender.com/api';
// or
const API_BASE_URL = 'https://your-heroku-app.herokuapp.com/api';
```

#### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# In your frontend directory
vercel

# Follow the prompts to deploy
```

#### 3. Configure Custom Domain (Optional)
```bash
# Add custom domain
vercel domains add yourdomain.com
```

### Option 2: Netlify

#### 1. Update API Configuration
Same as Vercel - update the API_BASE_URL in script.js

#### 2. Deploy to Netlify
1. Visit [netlify.com](https://netlify.com)
2. Drag and drop your frontend folder
3. Or connect GitHub repository for automatic deployments

#### 3. Configure Redirects (if needed)
Create `frontend/_redirects` file:
```
/*    /index.html   200
```

### Option 3: Static File Hosting

#### 1. Build for Production
```bash
# Update API URL in script.js
# Minify CSS/JS if desired
```

#### 2. Upload to Hosting
- Upload all files from `frontend/` directory
- Ensure `index.html` is the main file
- Configure server to serve static files

## 🔧 Production Configuration

### 1. CORS Configuration
Update backend CORS settings:
```javascript
// In backend/server.js
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'https://www.your-frontend-domain.com'
  ],
  credentials: true
}));
```

### 2. Security Headers
```javascript
// Already configured in server.js with helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

### 3. Rate Limiting
```javascript
// Adjust rate limits for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
```

## 💳 Payment Integration

### Replace Placeholder Payment Service

#### 1. Install Payment Provider SDK
```bash
# For Stripe
npm install stripe

# For Razorpay
npm install razorpay

# For PayPal
npm install @paypal/checkout-server-sdk
```

#### 2. Update Payment Service
```javascript
// backend/services/paymentService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async processPayment(userId, creatorId, amount, paymentDetails) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses cents
        currency: 'usd',
        customer: userId,
        metadata: { creatorId },
        payment_method: paymentDetails.paymentMethodId,
        confirm: true
      });

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        amount: amount,
        currency: 'USD',
        paymentMethod: 'stripe'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

#### 3. Add Environment Variables
```env
# Add to your production environment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 📁 File Storage Migration

### Option 1: AWS S3

#### 1. Install AWS SDK
```bash
npm install aws-sdk multer-s3
```

#### 2. Update Upload Middleware
```javascript
// backend/middleware/upload.js
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME,
  acl: 'private', // Important for content protection
  key: function (req, file, cb) {
    cb(null, `uploads/${req.user._id}/${Date.now()}-${file.originalname}`);
  }
});
```

#### 3. Environment Variables
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### Option 2: Cloudflare R2

#### 1. Configure R2 Storage
```javascript
// Similar to S3 but with R2 endpoints
const s3 = new AWS.S3({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto'
});
```

## 🔒 Security Checklist

### 1. Environment Variables
```env
# Generate strong JWT secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)

# Use strong database passwords
MONGODB_URI=mongodb+srv://user:strong-password@cluster.mongodb.net/db

# Set secure CORS origins
FRONTEND_URL=https://yourdomain.com
```

### 2. HTTPS Configuration
- Ensure both frontend and backend use HTTPS
- Configure SSL certificates
- Update all HTTP references to HTTPS

### 3. Database Security
- Enable MongoDB authentication
- Use connection string with credentials
- Set up database firewall rules
- Regular backups

### 4. File Upload Security
```javascript
// Enhanced file validation
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // Check file size (handled by multer limits)
  // Add virus scanning in production
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'));
  }
};
```

## 📊 Monitoring & Logging

### 1. Error Tracking
```bash
# Install Sentry for error tracking
npm install @sentry/node

# Configure in server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### 2. Performance Monitoring
```javascript
// Add request logging
const morgan = require('morgan');
app.use(morgan('combined'));

// Add performance monitoring
const responseTime = require('response-time');
app.use(responseTime());
```

### 3. Health Checks
```javascript
// Already included in server.js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
```

## 🚀 Post-Deployment

### 1. Test All Features
- [ ] User registration/login
- [ ] Content creation and viewing
- [ ] Subscription flow
- [ ] Payment processing
- [ ] File uploads
- [ ] Mobile responsiveness

### 2. Performance Optimization
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Optimize database queries
- [ ] Add caching where appropriate

### 3. Backup Strategy
- [ ] Set up automated database backups
- [ ] Test backup restoration
- [ ] Document recovery procedures

### 4. Monitoring Setup
- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Monitor performance metrics
- [ ] Set up log aggregation

## 🔄 Continuous Deployment

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm install
    
    - name: Run tests
      run: |
        cd backend
        npm test
    
    - name: Deploy to Render
      # Configure deployment to your chosen platform
```

## 📞 Support & Troubleshooting

### Common Issues

#### 1. CORS Errors
```javascript
// Ensure CORS is properly configured
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

#### 2. File Upload Issues
- Check file size limits
- Verify file type validation
- Ensure upload directory exists
- Check server disk space

#### 3. Database Connection Issues
- Verify MongoDB URI
- Check network connectivity
- Ensure database user has proper permissions

#### 4. Authentication Issues
- Verify JWT secret is set
- Check token expiration
- Ensure consistent secret across deployments

### Getting Help
1. Check server logs for errors
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check network connectivity between services

---

**Note**: This deployment guide covers the most common deployment scenarios. Adjust configurations based on your specific requirements and chosen hosting providers.