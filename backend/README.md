# 🚀 Cogniva Backend - Production-Ready API

> **Agentic AI Learning Platform** - Node.js + Express + MongoDB + JWT + Ollama

---

## 📋 Overview

This is a **production-ready backend** for Cogniva, a modern AI-powered learning platform that enables:

- ✅ **Secure JWT authentication** with password hashing
- ✅ **AI-powered tutoring** via local Ollama integration
- ✅ **Chat history management** with MongoDB
- ✅ **Course CRUD** with role-based access control
- ✅ **Scalable architecture** with service-based design

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-------------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js |
| **Database** | MongoDB |
| **Authentication** | JWT (JSON Web Tokens) + Bcrypt |
| **AI/LLM** | Ollama (Local) |
| **Validation** | Built-in Middleware |

---

## 📂 Project Structure

```
backend/
├── config/              # Configuration files
│   └── database.js      # MongoDB connection
├── controllers/         # Business logic
│   ├── tutorController.js
│   ├── chatController.js
│   └── courseController.js
├── middlewares/         # Express middleware
│   ├── auth.js          # JWT token verification
│   ├── rbac.js          # Role-based access control
│   └── errorHandler.js  # Global error handling
├── models/              # Mongoose schemas
│   ├── User.js
│   ├── Chat.js
│   └── Course.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── tutorRoutes.js
│   ├── chatRoutes.js
│   └── courseRoutes.js
├── services/            # External service integrations
│   └── OllamaService.js # Ollama AI integration
├── utils/               # Helper functions
├── .env.example         # Environment variables template
├── package.json         # Dependencies
└── index.js             # Express app entry point
```

---

## 🔧 Installation & Setup

### Prerequisites

- **Node.js 18+** and npm
- **MongoDB** (local or Atlas URI)
- **Ollama** running on `http://localhost:11434`

### Step 1: Clone & Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/cogniva
NODE_ENV=development

# Server
PORT=8000
HOST=localhost

# Ollama
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=phi

# JWT Authentication (change this to a strong secret in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or locally installed MongoDB
mongod
```

### Step 4: Start Ollama

```bash
# Install Ollama from https://ollama.ai
ollama serve

# In another terminal, pull the model
ollama pull phi
```

### Step 5: Start the Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

You should see:

```
╔══════════════════════════════════════════════════════════╗
║  🚀 Cogniva Backend Started Successfully                 ║
║  📍 Running on http://localhost:8000                      ║
║  🗄️  Database: MongoDB                                    ║
║  🔐 Auth: JWT + MongoDB                                   ║
║  🤖 AI: Ollama (phi model)                                ║
║  📚 Course Management: Enabled                            ║
╚══════════════════════════════════════════════════════════╝
```

---

## 📡 API Documentation

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

### 🔐 Auth Endpoints

#### Register/Ensure User in DB
```
POST /api/auth/register
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "firebase_uid": "abc123...",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "bio": "AI enthusiast",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

---

### 🤖 AI Tutor Endpoints

#### Send Message to Tutor
```
POST /api/tutor/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Explain neural networks",
  "conversation_id": "conv_123" // optional
}

Response:
{
  "success": true,
  "message": "Message processed successfully",
  "data": {
    "id": "chat_507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439011",
    "message": "Explain neural networks",
    "response": "Neural networks are computational models...",
    "model": "phi",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Chat History
```
GET /api/tutor/history?limit=20&skip=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Chat history retrieved",
  "data": [
    {
      "id": "chat_507f...",
      "message": "Explain neural networks",
      "response": "...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

#### Check AI Service Health
```
GET /api/tutor/health
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "AI Tutor service is healthy",
  "data": {
    "ollama_status": "connected",
    "available_models": ["phi", "mistral"],
    "current_model": "phi"
  }
}
```

---

### 💬 Chat Endpoints

#### Get Chat History
```
GET /api/chat/history?limit=20&skip=0
Authorization: Bearer <token>
```

#### Get Chat Statistics
```
GET /api/chat/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "total_conversations": 42,
    "recent_chats": [...]
  }
}
```

#### Delete Chat
```
DELETE /api/chat/:id
Authorization: Bearer <token>
```

#### Clear All Chats
```
DELETE /api/chat
Authorization: Bearer <token>
```

---

### 📚 Course Endpoints

#### Create Course (Faculty Only)
```
POST /api/course
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to AI",
  "description": "Learn AI fundamentals",
  "content": "Detailed course content...",
  "level": "Beginner",
  "duration_hours": 8,
  "tags": ["AI", "ML", "Python"]
}

Response:
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "course_507f...",
    "title": "Introduction to AI",
    "faculty_id": "507f1f77bcf86cd799439011",
    "is_published": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Get All Published Courses
```
GET /api/course?limit=20&skip=0&published=true
Authorization: Bearer <token>
```

#### Get Course by ID
```
GET /api/course/:id
Authorization: Bearer <token>
```

#### Update Course (Faculty Only)
```
PUT /api/course/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Advanced AI",
  "is_published": true
}
```

#### Delete Course (Faculty Only)
```
DELETE /api/course/:id
Authorization: Bearer <token>
```

#### Get Faculty Courses
```
GET /api/course/faculty/:faculty_id
Authorization: Bearer <token>
```

---

## 🔐 Role-Based Access Control

| Endpoint | Student | Faculty |
|----------|---------|---------|
| Create Course | ❌ | ✅ |
| Update Own Course | ❌ | ✅ |
| Delete Own Course | ❌ | ✅ |
| View Published Courses | ✅ | ✅ |
| Use AI Tutor | ✅ | ✅ |
| View Own Chat History | ✅ | ✅ |

---

## 🗄️ Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  firebase_uid: String (unique),
  email: String (unique),
  full_name: String,
  role: String (enum: ['student', 'faculty']),
  avatar_url: String,
  bio: String,
  is_active: Boolean,
  last_login: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Chats Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  firebase_uid: String,
  message: String,
  response: String,
  model: String,
  tokens_used: Number,
  conversation_id: String,
  created_at: Date
}
```

### Courses Collection

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  content: String,
  faculty_id: ObjectId (ref: User),
  faculty_name: String,
  level: String (enum: ['Beginner', 'Intermediate', 'Advanced']),
  duration_hours: Number,
  tags: [String],
  is_published: Boolean,
  enrollment_count: Number,
  rating: Number,
  created_at: Date,
  updated_at: Date
}
```

---

## 🧪 Testing with cURL

### Health Check
```bash
curl http://localhost:8000/health
```

### Auth Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json"
```

### Send Message to Tutor
```bash
curl -X POST http://localhost:8000/api/tutor/chat \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain machine learning"
  }'
```

### Create Course
```bash
curl -X POST http://localhost:8000/api/course \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Basics",
    "description": "Learn AI fundamentals",
    "level": "Beginner",
    "duration_hours": 6,
    "tags": ["AI", "Learning"]
  }'
```

---

## 🚀 Deployment Checklist

- [ ] Set environment variables in production
- [ ] Use MongoDB Atlas for cloud database
- [ ] Enable Firebase authentication
- [ ] Set proper CORS origins
- [ ] Use secrets manager for sensitive data
- [ ] Enable MongoDB backups
- [ ] Set up error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Use reverse proxy (Nginx)
- [ ] Enable HTTPS/SSL
- [ ] Set up CI/CD pipeline

---

## 📊 Performance Notes

- **Indexes**: All high-query fields are indexed
- **Pagination**: All list endpoints support limit/skip
- **Caching**: Can be added at service layer
- **Rate Limiting**: Not implemented yet (recommended)
- **Compression**: Use Nginx/Cloudflare

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
❌ MongoDB Connection Error
```
**Solution**: Ensure MongoDB is running on port 27017

### Firebase Initialization Error
```
❌ Firebase Initialization Error
```
**Solution**: Check `GOOGLE_APPLICATION_CREDENTIALS` path

### Ollama Not Available
```
Cannot reach the AI backend
```
**Solution**: Start Ollama with `ollama serve`

### CORS Error in Frontend
```
Access-Control-Allow-Origin error
```
**Solution**: Update `CORS_ORIGIN` in `.env`

---

## 📝 License

MIT License - Education & Research Use

---

## 👨‍💻 Support

For issues and questions, create an issue in the repository.

---

**Happy Learning! 🎓**
