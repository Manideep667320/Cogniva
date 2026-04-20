# 🚀 Cogniva Backend - Deployment Guide

Deploy your Node.js backend to cloud platforms in minutes.

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB cluster created (Atlas or self-hosted)
- [ ] Firebase project set up
- [ ] Ollama service accessible (cloud or local)
- [ ] `.env` file created (DO NOT commit)
- [ ] All tests passing
- [ ] `.gitignore` includes `.env`

---

## ☁️ Deployment Options

### Option 1: Heroku (Easiest)

#### Setup
1. Create Heroku account at heroku.com
2. Install Heroku CLI
3. Create app:
```bash
heroku create cogniva-backend
```

#### Deploy
```bash
# Add MongoDB Atlas URI
heroku config:set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cogniva

# Add other environment variables
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_CLIENT_EMAIL=your-email
heroku config:set GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
heroku config:set OLLAMA_API_URL=https://ai-api.example.com
heroku config:set CORS_ORIGIN=https://your-frontend.com

# Deploy
git push heroku main
```

#### View logs
```bash
heroku logs --tail
```

---

### Option 2: AWS EC2 + PM2

#### Setup Instance
```bash
# Launch EC2 instance (Ubuntu 22.04)
# SSH into instance
ssh -i key.pem ubuntu@ec2-instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/cogniva.git
cd cogniva/backend

# Install dependencies
npm install
```

#### Configure Environment
```bash
# Create .env file
nano .env
# Add all environment variables
```

#### Start with PM2
```bash
# Start application
pm2 start index.js --name "cogniva-backend"

# Save PM2 process list
pm2 save

# Enable startup script
pm2 startup
```

#### Setup Nginx Reverse Proxy
```bash
sudo apt-get install nginx

# Create config
sudo nano /etc/nginx/sites-available/cogniva

# Add:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/cogniva /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL with Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 3: Google Cloud Run

#### Setup
```bash
# Install Google Cloud SDK
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Create Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
EOF

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/cogniva-backend

# Deploy
gcloud run deploy cogniva-backend \
  --image gcr.io/YOUR_PROJECT_ID/cogniva-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGODB_URI=$MONGODB_URI,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,...
```

---

### Option 4: DigitalOcean App Platform

#### Deploy via GitHub
1. Connect GitHub account to DigitalOcean
2. Create new App
3. Select repository `cogniva/backend`
4. Configure build & run commands:
   - Build: `npm install`
   - Run: `npm start`
5. Add environment variables
6. Deploy

---

### Option 5: Docker + Docker Compose

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/cogniva
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - OLLAMA_API_URL=http://ollama:11434
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      - mongodb
      - ollama
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  mongodb_data:
  ollama_data:
```

#### Run
```bash
docker-compose up -d
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring
```bash
pm2 monit          # Monitor processes
pm2 logs           # View logs
pm2 save           # Save process list
pm2 resurrect      # Restore on reboot
```

### Sentry Error Tracking
```bash
npm install @sentry/node

# Add to index.js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

### CloudWatch (AWS)
```bash
npm install aws-sdk winston-cloudwatch
```

---

## 🔐 Security Checklist for Production

- [ ] Use HTTPS/SSL certificate
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Enable CORS properly (not *)
- [ ] Set secure MongoDB password
- [ ] Use VPC for database access
- [ ] Enable firewall rules
- [ ] Setup rate limiting
- [ ] Use environment secrets manager
- [ ] Enable database backups
- [ ] Setup monitoring & alerts

---

## 🚀 Scaling Considerations

### Load Balancing
```
nginx/HAProxy
    ↓
    ├─ Backend Instance 1 (PM2)
    ├─ Backend Instance 2 (PM2)
    └─ Backend Instance 3 (PM2)
    ↓
MongoDB Replica Set
```

### Database Optimization
- Enable MongoDB sharding for large datasets
- Create proper indexes (already in models)
- Use connection pooling
- Monitor query performance

### Caching Layer
```bash
npm install redis
# Add Redis for chat history caching
```

### CDN for Static Files
- Use CloudFront (AWS)
- Use Cloudflare
- Serve assets from S3/GCS

---

## 📈 Performance Optimization

```javascript
// Enable compression
import compression from 'compression';
app.use(compression());

// Enable caching headers
app.use(express.static('public', { maxAge: '1h' }));

// Connection pooling
// Already configured in Mongoose

// Database query optimization
// Use indexes and lean() for read-only queries
```

---

## 🔄 CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          npm run deploy
```

---

## 📞 Deployment Support

| Platform | Time to Deploy | Cost | Difficulty |
|----------|----------------|------|-----------|
| Heroku | 5 min | $7-25/mo | ⭐ Easy |
| AWS EC2 | 15 min | $5-10/mo | ⭐⭐ Medium |
| DigitalOcean | 10 min | $5/mo | ⭐ Easy |
| Google Cloud Run | 10 min | Pay-as-you-go | ⭐⭐ Medium |
| Docker | Varies | Your infra | ⭐⭐⭐ Hard |

---

**Deploy with confidence! Your backend is production-ready.** 🚀
