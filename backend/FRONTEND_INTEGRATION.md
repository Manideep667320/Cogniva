# 🔗 Frontend-Backend Integration Guide

This guide shows how to connect your Cogniva frontend to the production-ready backend.

---

## 🎯 Quick Start

### 1. Update Frontend API Configuration

Create `src/lib/api-client.ts` in your frontend:

```typescript
// src/lib/api-client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem('authToken')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}
```

### 2. Add Environment Variable

Create `.env.local` in frontend:

```env
VITE_API_URL=http://localhost:8000
```

For production:

```env
VITE_API_URL=https://api.cogniva.com
```

### 3. Update Frontend Services

Update `src/lib/api.ts`:

```typescript
import { apiCall } from './api-client'

// AI Tutor Service
export async function sendTutorMessage(message: string, conversationId?: string) {
  return apiCall('/api/tutor/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
  })
}

export async function getChatHistory(limit = 20, skip = 0) {
  return apiCall(`/api/tutor/history?limit=${limit}&skip=${skip}`)
}

export async function checkTutorHealth() {
  return apiCall('/api/tutor/health')
}

// Chat Service
export async function getChatStats() {
  return apiCall('/api/chat/stats')
}

export async function deleteChat(chatId: string) {
  return apiCall(`/api/chat/${chatId}`, { method: 'DELETE' })
}

// Course Service
export async function createCourse(courseData: any) {
  return apiCall('/api/course', {
    method: 'POST',
    body: JSON.stringify(courseData),
  })
}

export async function getCourses(limit = 20, skip = 0, published = true) {
  return apiCall(
    `/api/course?limit=${limit}&skip=${skip}&published=${published}`
  )
}

export async function getCourse(courseId: string) {
  return apiCall(`/api/course/${courseId}`)
}

export async function updateCourse(courseId: string, data: any) {
  return apiCall(`/api/course/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCourse(courseId: string) {
  return apiCall(`/api/course/${courseId}`, { method: 'DELETE' })
}

// Auth Service
export async function registerUser() {
  return apiCall('/api/auth/register', { method: 'POST' })
}

export async function getCurrentUser() {
  return apiCall('/api/auth/me')
}

export async function updateProfile(data: any) {
  return apiCall('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
```

---

## 🔐 Firebase Integration

### 1. Get Firebase Token After Login

In your auth context or login component:

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

export async function signIn(email: string, password: string) {
  const auth = getAuth()
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  
  // Get ID token
  const token = await userCredential.user.getIdToken()
  
  // Store token
  localStorage.setItem('authToken', token)
  
  // Register user in backend
  await registerUser()
  
  return userCredential.user
}
```

### 2. Pass Token with Requests

Already handled in `apiCall()` function - it automatically includes the token in the `Authorization` header.

### 3. Handle Token Refresh

```typescript
// Refresh token every time user opens the app
export async function refreshAuthToken() {
  const auth = getAuth()
  const user = auth.currentUser
  
  if (user) {
    const token = await user.getIdToken(true) // Force refresh
    localStorage.setItem('authToken', token)
  }
}

// Call on app startup
export function useAuth() {
  useEffect(() => {
    refreshAuthToken()
  }, [])
}
```

---

## 💬 Update AITutorPage Component

```typescript
// src/pages/AITutorPage.tsx
import { sendTutorMessage, getChatHistory } from '@/lib/api'

export function AITutorPage() {
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [loading, setLoading] = useState(false)

  // Load chat history
  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      const response = await getChatHistory(20)
      if (response.success) {
        // Process history...
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  async function sendMessage(text: string) {
    setLoading(true)
    try {
      const response = await sendTutorMessage(text)
      
      if (response.success) {
        const assistantMsg: LocalMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: response.data.created_at,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        setError(response.message)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Your component JSX
  )
}
```

---

## 📚 Update CoursesPage Component

```typescript
// src/pages/CoursesPage.tsx
import { getCourses, createCourse, updateCourse, deleteCourse } from '@/lib/api'

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])

  // Load courses
  useEffect(() => {
    loadCourses()
  }, [])

  async function loadCourses() {
    try {
      const response = await getCourses(20, 0, true)
      if (response.success) {
        setCourses(response.data)
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
  }

  async function handleCreateCourse(formData: any) {
    try {
      const response = await createCourse(formData)
      if (response.success) {
        loadCourses()
        // Show success message
      }
    } catch (error) {
      console.error('Failed to create course:', error)
    }
  }

  return (
    // Your component JSX
  )
}
```

---

## 🚀 Environment Configuration

### Development (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_PROJECT_ID=cogniva-dev-12345
```

### Staging (.env.staging)
```env
VITE_API_URL=https://staging-api.cogniva.com
VITE_FIREBASE_PROJECT_ID=cogniva-staging-12345
```

### Production (.env.production)
```env
VITE_API_URL=https://api.cogniva.com
VITE_FIREBASE_PROJECT_ID=cogniva-prod-12345
```

---

## 📡 API Error Handling

```typescript
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        // Token expired - redirect to login
        localStorage.removeItem('authToken')
        window.location.href = '/login'
      }
      
      throw new Error(data.message || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error)
    throw error
  }
}
```

---

## 🔄 Update AuthContext

```typescript
// src/contexts/AuthContext.tsx
import { registerUser, getCurrentUser, updateProfile } from '@/lib/api'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ... existing code ...

  async function signUp(email: string, password: string, fullName: string, role: 'student' | 'faculty') {
    try {
      // Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Get token
      const token = await userCredential.user.getIdToken()
      localStorage.setItem('authToken', token)
      
      // Register in backend
      await registerUser()
      
      return { error: null }
    } catch (err: any) {
      return { error: err.message }
    }
  }

  // ... rest of context ...
}
```

---

## 🧪 Testing Integration

1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm run dev` (in frontend folder)
3. Test health: `curl http://localhost:8000/health`
4. Try sending message: Use Postman or frontend UI
5. Check browser console for errors

---

## 🎯 Testing Checklist

- [ ] Frontend connects to backend
- [ ] Authentication token passed correctly
- [ ] Send message to AI tutor works
- [ ] Chat history loads
- [ ] Create course works (faculty)
- [ ] Get courses works
- [ ] Error handling shows proper messages
- [ ] Loading states work correctly
- [ ] CORS headers configured

---

## 🚨 Common Issues

### CORS Error
```
Access-Control-Allow-Origin header missing
```
**Fix**: Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL

### 401 Unauthorized
```
Invalid or expired token
```
**Fix**: Token may have expired. Refresh in `refreshAuthToken()`

### 404 Not Found
```
Route not found
```
**Fix**: Check API endpoint spelling and backend routes

### Connection Refused
```
Cannot connect to localhost:8000
```
**Fix**: Ensure backend is running: `npm run dev`

---

## 📚 API Contract Example

When calling an API, expect this response format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Your data here
  },
  "pagination": {
    "total": 100,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Additional error detail"]
}
```

---

**Ready to connect! Your frontend and backend are now integrated.** 🚀
