#!/bin/bash

# Cogniva Backend API Testing Script
# This script uses curl to test all API endpoints
# Replace <firebase_token> with your actual Firebase ID token

BASE_URL="http://localhost:8000"
TOKEN="<firebase_token_here>"

echo "🧪 Cogniva Backend API Tests"
echo "======================================"

# 1. Health Check
echo -e "\n✅ 1. Health Check"
curl -s $BASE_URL/health | jq .

# 2. Register User
echo -e "\n✅ 2. Register User"
curl -s -X POST $BASE_URL/api/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

# 3. Get Current User
echo -e "\n✅ 3. Get Current User"
curl -s $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# 4. Update Profile
echo -e "\n✅ 4. Update Profile"
curl -s -X PUT $BASE_URL/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "bio": "AI Enthusiast"
  }' | jq .

# 5. Check AI Tutor Health
echo -e "\n✅ 5. Check AI Tutor Health"
curl -s $BASE_URL/api/tutor/health \
  -H "Authorization: Bearer $TOKEN" | jq .

# 6. Send Message to Tutor
echo -e "\n✅ 6. Send Message to Tutor"
curl -s -X POST $BASE_URL/api/tutor/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain machine learning in simple terms"
  }' | jq .

# 7. Get Chat History
echo -e "\n✅ 7. Get Chat History"
curl -s $BASE_URL/api/tutor/history \
  -H "Authorization: Bearer $TOKEN" | jq .

# 8. Get Chat Statistics
echo -e "\n✅ 8. Get Chat Statistics"
curl -s $BASE_URL/api/chat/stats \
  -H "Authorization: Bearer $TOKEN" | jq .

# 9. Create Course (Faculty only)
echo -e "\n✅ 9. Create Course (Faculty only)"
curl -s -X POST $BASE_URL/api/course \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to AI",
    "description": "Learn AI fundamentals from scratch",
    "content": "# Course Content\n\nThis course covers...",
    "level": "Beginner",
    "duration_hours": 8,
    "tags": ["AI", "Machine Learning", "Python"]
  }' | jq .

# 10. Get All Courses
echo -e "\n✅ 10. Get All Published Courses"
curl -s "$BASE_URL/api/course?limit=10&skip=0&published=true" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 11. Get Specific Course
echo -e "\n✅ 11. Get Specific Course"
echo "Note: Replace <course_id> with actual course ID from step 9"
# curl -s $BASE_URL/api/course/<course_id> \
#   -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n======================================"
echo "Tests completed! ✨"
