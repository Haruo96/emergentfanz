# ContentVault - Premium Content Monetization Platform

A complete content monetization platform similar to OnlyFans, built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

### User System
- **Authentication**: JWT-based login/register with bcrypt password hashing
- **User Roles**: Creator and Fan accounts with different permissions
- **Profile Management**: Bio, profile pictures, subscription pricing

### Content System
- **Post Creation**: Text, image, and video content support
- **Access Control**: Public posts vs subscriber-only content
- **Media Handling**: Secure file uploads with validation
- **Engagement**: Likes, comments, and view tracking

### Subscription System
- **Creator Subscriptions**: Monthly subscription model
- **Payment Processing**: Placeholder payment system (easily replaceable)
- **Access Management**: Automatic content access based on subscription status
- **Subscription Management**: View, cancel, and manage subscriptions

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **File Validation**: Only images/videos allowed
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Secure cross-origin requests

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Multer** for file uploads
- **Helmet** for security headers
- **Joi** for input validation

### Frontend
- **Vanilla HTML/CSS/JavaScript**
- **Responsive Design** with mobile-first approach
- **Modern UI** with gradients and animations
- **Font Awesome** icons

### Database Schema
```javascript
// Users
{
  username: String,
  email: String,
  passwordHash: String,
  role: 'creator' | 'fan',
  bio: String,
  profilePic: String,
  subscriptionPrice: Number,
  subscriberCount: Number
}

// Posts
{
  creatorId: ObjectId,
  title: String,
  content: String,
  mediaURL: [String],
  mediaType: 'text' | 'image' | 'video' | 'mixed',
  isPublic: Boolean,
  tags: [String],
  likes: [{ userId, createdAt }],
  comments: [{ userId, content, createdAt }],
  viewCount: Number
}

// Subscriptions
{
  fanId: ObjectId,
  creatorId: ObjectId,
  startDate: Date,
  endDate: Date,
  paymentStatus: 'pending' | 'active' | 'expired' | 'cancelled',
  amount: Number,
  transactionId: String
}
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd content-platform

# Install backend dependencies
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if running locally)
mongod

# Start the backend server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Serve the frontend (using any static server)
# Option 1: Using Python
python -m http.server 3000

# Option 2: Using Node.js http-server
npx http-server -p 3000

# Option 3: Using Live Server (VS Code extension)
# Right-click index.html and select "Open with Live Server"
```

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/content-platform

# JWT Secret (Change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Deployment

### Backend Deployment (Render/Heroku/DigitalOcean)

1. **Environment Setup**:
   ```bash
   # Set production environment variables
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/content-platform
   JWT_SECRET=your-production-jwt-secret
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Database Setup**:
   - Use MongoDB Atlas for production
   - Create a new cluster and database
   - Update MONGODB_URI in environment variables

3. **File Storage**:
   - Current: Local file storage
   - Production: Easily switch to AWS S3/Cloudflare R2 (see instructions below)

### Frontend Deployment (Vercel/Netlify)

1. **Update API URL**:
   ```javascript
   // In frontend/script.js, update:
   const API_BASE_URL = 'https://your-backend-domain.com/api';
   ```

2. **Deploy**:
   - Upload frontend files to your hosting provider
   - Ensure CORS is configured correctly in backend

## 💳 Payment Integration

The platform includes a placeholder payment system that can be easily replaced with your country's payment provider.

### Current Implementation
```javascript
// backend/services/paymentService.js
async function processPayment(userId, creatorId, amount, paymentDetails) {
  // PLACEHOLDER: Replace with real payment processing
  return {
    success: true,
    transactionId: `TEMP_${Date.now()}`,
    amount: amount
  };
}
```

### Integration Examples

#### Stripe (Global)
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function processPayment(userId, creatorId, amount, paymentDetails) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe uses cents
    currency: 'usd',
    customer: userId,
    metadata: { creatorId }
  });
  
  return {
    success: paymentIntent.status === 'succeeded',
    transactionId: paymentIntent.id,
    amount: amount
  };
}
```

#### Razorpay (India)
```javascript
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function processPayment(userId, creatorId, amount, paymentDetails) {
  const order = await razorpay.orders.create({
    amount: amount * 100, // Razorpay uses paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  });
  
  return {
    success: true,
    transactionId: order.id,
    amount: amount
  };
}
```

## 📁 File Storage Migration

### Current: Local Storage
Files are stored in `backend/uploads/` directory.

### Migration to Cloud Storage

#### AWS S3 Integration
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
  key: function (req, file, cb) {
    cb(null, `uploads/${req.user._id}/${Date.now()}-${file.originalname}`);
  }
});
```

#### Cloudflare R2 Integration
```javascript
// Similar to S3, but with Cloudflare R2 endpoints
const s3 = new AWS.S3({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  region: 'auto'
});
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Posts
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create new post (creators only)
- `GET /api/posts/:id` - Get single post
- `GET /api/posts/creator/:creatorId` - Get creator's posts
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment
- `DELETE /api/posts/:id` - Delete post

### Users
- `GET /api/users/creators` - Get all creators
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/posts` - Get user's public posts

### Subscriptions
- `POST /api/subscriptions/subscribe` - Subscribe to creator
- `GET /api/subscriptions/my-subscriptions` - Get user's subscriptions
- `GET /api/subscriptions/my-subscribers` - Get creator's subscribers
- `POST /api/subscriptions/cancel/:id` - Cancel subscription
- `GET /api/subscriptions/check/:creatorId` - Check subscription status

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change JWT_SECRET to a strong, random value
- [ ] Use HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Validate all file uploads
- [ ] Use environment variables for sensitive data
- [ ] Set up proper database indexes
- [ ] Configure proper error handling
- [ ] Set up logging and monitoring

### File Upload Security
- File type validation (images/videos only)
- File size limits (50MB default)
- Virus scanning (recommended for production)
- CDN integration for better performance

## 🎨 Customization

### Styling
- Modify `frontend/styles.css` for custom themes
- Update color scheme in CSS variables
- Add custom animations and transitions

### Features
- Add video streaming capabilities
- Implement live streaming
- Add messaging system
- Create mobile apps
- Add analytics dashboard

## 📱 Mobile Responsiveness

The platform is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🚀 Future Enhancements

- [ ] Real-time messaging
- [ ] Live streaming support
- [ ] Mobile applications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Advanced content filtering
- [ ] Creator verification system
- [ ] Referral program
- [ ] Advanced payment options
- [ ] Content scheduling

---

**Note**: This is a complete, production-ready platform with placeholder payment integration. Replace the payment service with your preferred payment provider before going live.