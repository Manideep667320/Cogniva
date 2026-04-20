# Environment Variables Documentation

## Core Configuration

### Node Environment
```
NODE_ENV=development      # development | production | test
PORT=8000                 # Server port
HOST=localhost            # Server host
```

## Database Configuration

### MongoDB
```
MONGODB_URI=mongodb://localhost:27017/cogniva
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/cogniva?retryWrites=true&w=majority
```

## Authentication Configuration

### JWT (JSON Web Tokens)
```
# Generate a strong random secret (at least 32 characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=7d     # Token expiration time (e.g., 7d, 24h, 30d)
```

**How to generate a secure JWT_SECRET:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## AI/LLM Configuration

### Ollama
```
OLLAMA_API_URL=http://localhost:11434      # Ollama server address
OLLAMA_MODEL=phi                            # Model name (phi, mistral, llama2, etc.)
```

## CORS Configuration
```
CORS_ORIGIN=http://localhost:5173          # Frontend URL for CORS
```

---

## 🔐 Security Guidelines

1. **Never commit .env file to repository**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for template

2. **Use strong secrets in production**
   ```
   JWT_SECRET=<generate-random-64-char-string>
   MONGODB_URI=<use-atlas-with-strong-password>
   ```

3. **Rotate JWT secrets periodically**
   - Change JWT_SECRET every 90 days
   - Existing tokens remain valid until expiry

4. **Password security**
   - Minimum 6 characters (enforce in frontend: 8+ chars)
   - Passwords are hashed with bcrypt (10 rounds)
   - Never store plain-text passwords

5. **Environment-specific configs**
   ```bash
   # Development
   NODE_ENV=development
   JWT_SECRET=dev-secret-not-secure
   
   # Production
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret>
   CORS_ORIGIN=https://cogniva.com
   ```

6. **Token security**
   - Tokens expire after 7 days by default
   - Store tokens in secure HTTP-only cookies (frontend implementation)
   - Don't expose tokens in logs or error messages

5. **Use secrets manager in production**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager
   - HashiCorp Vault

---

## 🧪 Example .env File

```env
# Development Environment
NODE_ENV=development
PORT=8000
HOST=localhost

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cogniva

# Firebase
FIREBASE_PROJECT_ID=cogniva-dev-12345
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@cogniva-dev-12345.iam.gserviceaccount.com
GOOGLE_APPLICATION_CREDENTIALS=/Users/username/firebase-key.json

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRY=7d

# Ollama
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=phi

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 🚀 Production Environment

```env
# Production Environment
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# MongoDB Atlas
MONGODB_URI=mongodb+srv://cogniva_user:secure_password@cluster0.mongodb.net/cogniva?retryWrites=true&w=majority

# Firebase Production
FIREBASE_PROJECT_ID=cogniva-prod-12345
GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-key.json

# JWT
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRY=7d

# Ollama (hosted service or local)
OLLAMA_API_URL=https://ai-api.example.com
OLLAMA_MODEL=phi

# CORS - Production Domain
CORS_ORIGIN=https://cogniva.com

# Additional Production Settings
LOG_LEVEL=info
RATE_LIMIT=100
```

---

## 📋 Required Environment Variables Checklist

For the backend to run, you MUST set:

- [ ] `MONGODB_URI` - Database connection
- [ ] `FIREBASE_PROJECT_ID` - Firebase project
- [ ] `FIREBASE_CLIENT_EMAIL` - Firebase service account
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` - Path to Firebase key OR provide the key values
- [ ] `OLLAMA_API_URL` - Ollama server URL
- [ ] `OLLAMA_MODEL` - Default LLM model
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `CORS_ORIGIN` - Frontend URL for CORS

---

## ⚠️ Common Issues

### Missing Environment Variables
```
Error: process.env.MONGODB_URI is undefined
```
**Solution**: Check all required variables are in `.env`

### Firebase Key Not Found
```
Error: GOOGLE_APPLICATION_CREDENTIALS not found
```
**Solution**: Ensure path is correct and file exists

### Ollama Not Responding
```
Error: ECONNREFUSED at OLLAMA_API_URL
```
**Solution**: Check OLLAMA_API_URL is correct and Ollama is running

---

## 🔗 Generate Secure Secrets

```bash
# Generate JWT_SECRET (64 characters)
openssl rand -base64 32

# Generate random MongoDB password
openssl rand -base64 20

# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

**Always use HTTPS and secure secrets in production!** 🔒
