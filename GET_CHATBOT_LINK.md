# Quick Access to Chatbot

## 🚀 Instant Chatbot Access

### Step 1: Login
1. Go to: **http://localhost:3002/login**
2. Use these credentials:
   - **Email:** `parent1@test.com`
   - **Password:** `Parent@123`

### Step 2: Access from Dashboard
Once logged in, your dashboard will show any assigned assessments.
Click "Start Assessment" to automatically launch the chatbot.

---

## 📋 Manual Access (If you need a specific student/session)

If you want to access the chatbot for a specific student, you need:

### Required Information:
1. **Student ID** - UUID of the student
2. **Session Token** - Generated when starting an assessment

### URL Format:
```
http://localhost:3002/student/[STUDENT_ID]/assessment/[SESSION_TOKEN]
```

### Example:
```
http://localhost:3002/student/49f2850e-ff24-4990-aa89-99ae7f0431c4/assessment/abc123token
```

---

## 🔧 Create a New Assessment Session

Use this API call to create a new chatbot session:

```bash
# 1. First, login to get your token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent1@test.com",
    "password": "Parent@123"
  }'

# Copy the "access_token" from the response

# 2. Start a new assessment session
curl -X POST http://localhost:8000/api/v1/chatbot/sessions/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "student_id": "49f2850e-ff24-4990-aa89-99ae7f0431c4"
  }'

# You'll get back a session with a "resume_token"
# Use this token in the URL: /student/[student_id]/assessment/[resume_token]
```

---

## 📱 Test Accounts

### Parents:
| Email | Password | Name |
|-------|----------|------|
| parent1@test.com | Parent@123 | Sarah Johnson |
| parent2@test.com | Parent@123 | Michael Chen |
| parent3@test.com | Parent@123 | Emily Rodriguez |

### Psychologists (to assign assessments):
| Email | Password | Name |
|-------|----------|------|
| dr.smith@test.com | Doctor@123 | Dr. Jennifer Smith |
| dr.patel@test.com | Doctor@123 | Dr. Raj Patel |

---

## ⚡ Fastest Way to Test Chatbot Right Now:

### Just do this:

1. **Open browser**: http://localhost:3002/login
2. **Login**: parent1@test.com / Parent@123
3. **Click dashboard** - you'll see assigned assessments
4. **Click "Start Assessment"** - BOOM! You're in the chatbot!

The chatbot will automatically:
- ✅ Load all questions (12 questions across 4 sections)
- ✅ Track your progress
- ✅ Save answers automatically
- ✅ Show progress bar
- ✅ Auto-navigate to next questions
- ✅ Complete when all answered

---

## 🎨 Chatbot Features

Your existing chatbot page includes:

- ✅ Beautiful UI with progress tracking
- ✅ Multiple question types (Yes/No, Scale 1-5, Text, Multiple Choice)
- ✅ Auto-save functionality
- ✅ Section-based organization
- ✅ Real-time progress percentage
- ✅ Save & Exit option (resume later)
- ✅ Auto-redirect to reports when complete

---

**Need help?** Just login as a parent and look for the assessment dashboard!
