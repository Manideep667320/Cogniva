# 🚀 Cogniva Backend - Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] MongoDB installed or Atlas account
- [ ] Firebase project created
- [ ] Ollama installed and running
- [ ] Git installed

---

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create .env File
```bash
cp .env.example .env
```

### 3. Configure Environment
Edit `.env` with your values:
```env
MONGODB_URI=mongodb://localhost:27017/cogniva
FIREBASE_PROJECT_ID=your-project-id
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=phi
CORS_ORIGIN=http://localhost:5173
```

### 4. Firebase Setup
```bash
# Set the path to your Firebase service account key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

### 5. Start Services
Terminal 1 - MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Terminal 2 - Ollama:
```bash
ollama serve
# In another window: ollama pull phi
```

Terminal 3 - Backend:
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Firebase Admin Initialized
🚀 Cogniva Backend Started Successfully
📍 Running on http://localhost:8000
```

---

## 🧪 Test the API

```bash
# Health check
curl http://localhost:8000/health

# Send message (requires Firebase token)
curl -X POST http://localhost:8000/api/tutor/chat \
  -H "Authorization: Bearer <your_firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

---

## 📁 Project Structure Summary

```
backend/
├── config/          # Database & Firebase config
├── controllers/     # API logic (thin, clean)
├── middlewares/     # Auth, RBAC, Error handling
├── models/          # MongoDB schemas
├── routes/          # API route definitions
├── services/        # External integrations (Ollama)
├── index.js         # Express app entry
├── .env             # Environment variables
└── package.json     # Dependencies
```

---

## 🔗 Frontend Integration

Update your frontend API calls:

```javascript
// Frontend API Configuration
const API_BASE = 'http://localhost:8000'
const FIREBASE_TOKEN = localStorage.getItem('authToken')

// Example: Send message to AI Tutor
async function sendTutorMessage(message) {
  const response = await fetch(`${API_BASE}/api/tutor/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIREBASE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })
  return response.json()
}

// Example: Get chat history
async function getChatHistory() {
  const response = await fetch(`${API_BASE}/api/tutor/history`, {
    headers: {
      'Authorization': `Bearer ${FIREBASE_TOKEN}`
    }
  })
  return response.json()
}
```

---

## 🆘 Troubleshooting

### MongoDB Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Firebase Token Invalid
```
401 Unauthorized - Invalid or expired token
```
**Solution**: Get fresh Firebase token from frontend

### Ollama Not Responding
```
Cannot reach the AI backend
```
**Solution**: Start Ollama
```bash
ollama serve
# Then in another terminal
ollama pull phi
```

### CORS Error
```
Access-Control-Allow-Origin header missing
```
**Solution**: Check CORS_ORIGIN in .env matches frontend URL

---

## 📊 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Register user |
| GET | /api/auth/me | Get user profile |
| POST | /api/tutor/chat | Send AI message |
| GET | /api/tutor/history | Get chat history |
| GET | /api/tutor/health | Check AI health |
| GET | /api/chat/stats | Get statistics |
| POST | /api/course | Create course (faculty) |
| GET | /api/course | Get all courses |
| PUT | /api/course/:id | Update course (faculty) |
| DELETE | /api/course/:id | Delete course (faculty) |

---

## 🔒 Security Notes

- All routes require Firebase authentication (except `/health`)
- JWT tokens handled by Firebase
- MongoDB passwords should use strong secrets
- CORS is restricted to frontend origin
- Sensitive data in `.env` (never commit)

---

## 📈 Next Steps

1. ✅ Backend running on `localhost:8000`
2. ✅ Frontend connecting to backend
3. ✅ MongoDB storing data
4. ✅ Firebase authenticating users
5. ✅ Ollama generating AI responses

---

**Backend is production-ready! Deploy to cloud (AWS, GCP, Azure) when ready.** 🚀
