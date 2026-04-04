# EdPsych AI - Visual Workflow Summary

## 🎯 Complete System Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     EDPSYCH AI PLATFORM                         │
│              Educational Psychology Assessment                   │
└─────────────────────────────────────────────────────────────────┘

                            ↓

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   PSYCHOLOGIST       │  │   PARENT/SCHOOL      │  │      ADMIN           │
│   psychologist@      │  │   (Auto-created)     │  │   admin@test.com     │
│   test.com           │  │                      │  │   admin123           │
│   test123            │  │                      │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

---

## 🔄 Workflow 1: Psychologist → Student → Assessment

```
Step 1: PSYCHOLOGIST CREATES STUDENT
┌────────────────────────────────────────────────────────┐
│ Psychologist Dashboard                                 │
│ → Click "Create New Student"                          │
│ → 3-Step Wizard:                                      │
│    1. Student Info (Name, DOB, Grade, School)        │
│    2. Add Parents (Multiple parents supported)        │
│    3. Review & Submit                                 │
└────────────────────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ STUDENT CREATED      │
         │ + Parent accounts    │
         │   auto-generated     │
         │ + Temp passwords     │
         │   provided           │
         └──────────────────────┘

Step 2: ASSIGN ASSESSMENT
┌────────────────────────────────────────────────────────┐
│ Psychologist selects:                                  │
│ → Student: John Doe                                   │
│ → Assessment Type: Parent Assessment (Hybrid Chat)    │
│ → Assigned To: Sarah Doe (Mother)                    │
│ → Due Date: Future date                               │
│ → Notes: Instructions for parent                      │
└────────────────────────────────────────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ ASSIGNMENT CREATED   │
         │ + Secure link        │
         │   generated          │
         │ + OTP code sent      │
         │ + Email sent         │
         └──────────────────────┘
```

---

## 🔐 Workflow 2: Parent Verification (Multi-Layer Security)

```
PARENT RECEIVES EMAIL
┌────────────────────────────────────────────────────────┐
│ Subject: Assessment for John Doe                       │
│                                                        │
│ Click here to complete assessment:                     │
│ http://localhost:3000/verify-access/abc123xyz...      │
│                                                        │
│ Your OTP code: 123456                                 │
└────────────────────────────────────────────────────────┘
                    ↓

LAYER 1: OTP VERIFICATION
┌────────────────────────────────────────────────────────┐
│ Verification Page (Step 1 of 2)                       │
│                                                        │
│ Student: John Doe                                     │
│                                                        │
│ Enter 6-digit OTP code:                               │
│ [_][_][_][_][_][_]                                   │
│                                                        │
│ [Verify OTP]                                          │
│                                                        │
│ ⚠️  Max 3 attempts                                    │
└────────────────────────────────────────────────────────┘
                    ↓
         ✅ OTP VERIFIED
                    ↓

LAYER 2: DOB VERIFICATION
┌────────────────────────────────────────────────────────┐
│ Date of Birth Verification (Step 2 of 2)             │
│                                                        │
│ Student: John Doe                                     │
│                                                        │
│ Enter student's date of birth:                        │
│ [MM] / [DD] / [YYYY]                                 │
│                                                        │
│ [Verify Date of Birth]                                │
│                                                        │
│ ⚠️  Max 3 attempts                                    │
└────────────────────────────────────────────────────────┘
                    ↓
         ✅ DOB VERIFIED
         ✅ FULLY VERIFIED
                    ↓
    → Redirect to Assessment ←
```

---

## 💬 Workflow 3: Hybrid Chat Assessment

```
HYBRID CHATBOT INTERFACE
┌────────────────────────────────────────────────────────┐
│ EdPsych AI Assessment - John Doe                      │
│────────────────────────────────────────────────────────│
│                                                        │
│ 🤖 Bot: Hello! I'm here to help assess John's         │
│         development. Let's start with attention.       │
│                                                        │
│ 🤖 Bot: Does John have difficulty focusing on tasks?  │
│         [Always] [Often] [Sometimes] [Rarely] [Never] │
│                                                        │
│ 👤 Parent: [Selects "Often"]                          │
│                                                        │
│ 🤖 Bot: Can you describe a recent situation where     │
│         John had trouble focusing?                     │
│                                                        │
│ 👤 Parent: [Types response]                           │
│    "During homework time, he gets distracted by       │
│     every sound and can't concentrate for more        │
│     than 5 minutes..."                                │
│                                                        │
│ 🤖 Bot: [AI analyzes response]                        │
│         Follow-up: How does this affect his homework  │
│         completion?                                    │
│                                                        │
│ [Assessment continues with adaptive questions...]      │
│                                                        │
│ Progress: ████████░░░░░░░░░░ 40% Complete            │
└────────────────────────────────────────────────────────┘

ASSESSMENT CATEGORIES:
1. ✅ Attention & Focus (Completed)
2. 🔄 Social Skills (In Progress)
3. ⏳ Emotional Regulation (Pending)
4. ⏳ Academic Performance (Pending)
5. ⏳ Behavioral Patterns (Pending)
```

---

## 🔬 Workflow 4: AI Analysis & Report Generation

```
ASSESSMENT COMPLETED
         ↓
┌────────────────────────────────────────────────────────┐
│ AI PROCESSING ENGINE                                   │
│                                                        │
│ 1. Extract all responses                              │
│    → MCQ answers                                      │
│    → Text responses                                   │
│    → Adaptive Q&A                                     │
│                                                        │
│ 2. Analyze patterns                                   │
│    → Attention issues: MODERATE                       │
│    → Social skills: LOW CONCERN                       │
│    → Emotional regulation: HIGH CONCERN               │
│                                                        │
│ 3. Integrate IQ test data (if uploaded)              │
│    → Cognitive profile                                │
│    → Strengths & weaknesses                           │
│                                                        │
│ 4. Generate comprehensive report                      │
│    → Executive summary                                │
│    → Detailed analysis                                │
│    → Recommendations                                  │
│    → Next steps                                       │
└────────────────────────────────────────────────────────┘
         ↓
   REPORT GENERATED
         ↓

PSYCHOLOGIST REVIEW
┌────────────────────────────────────────────────────────┐
│ AI-Generated Report for John Doe                      │
│────────────────────────────────────────────────────────│
│                                                        │
│ [View Full Report]                                     │
│                                                        │
│ Psychologist Actions:                                  │
│ • [✓] Approve Report                                  │
│ • [✏] Request Modifications                           │
│ • [📝] Add Notes                                      │
│ • [📧] Send to Parent                                 │
│                                                        │
│ Status: PENDING REVIEW                                │
└────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Permissions

```
PSYCHOLOGIST (psychologist@test.com)
├─ ✅ Create students with parents
├─ ✅ Assign assessments
├─ ✅ Upload IQ test reports
├─ ✅ Review AI-generated reports
├─ ✅ Approve/modify reports
├─ ✅ Send final reports to parents
└─ ✅ View all students and assessments

ADMIN (admin@test.com)
├─ ✅ Full system access
├─ ✅ User management
├─ ✅ System configuration
├─ ✅ Analytics & reports
└─ ✅ Master control

PARENT (auto-created)
├─ ✅ Multi-layer verification
├─ ✅ Complete hybrid assessment
├─ ✅ View final reports
└─ ❌ Cannot create students

SCHOOL (school@test.com)
├─ ✅ Verification access
├─ ✅ Complete teacher assessments
└─ ✅ View student reports
```

---

## 🎨 Page Structure Overview

```
PUBLIC PAGES
/
├─ Homepage (3 portals: Psychologist, Parent/School, Admin)
├─ /login (All roles)
└─ /register (New psychologist registration)

PSYCHOLOGIST PORTAL
/psychologist
├─ /dashboard (Main overview)
├─ /students (List all students)
├─ /students/create (3-step wizard)
├─ /students/[id] (Student profile)
├─ /students/[id]/upload (Upload IQ report)
├─ /assessments (Assignment management)
└─ /reports (Review AI reports)

VERIFICATION FLOW
/verify-access/[token] → OTP verification (Step 1)
/verify-dob/[token] → DOB verification (Step 2)
     ↓
/chat/test → Hybrid assessment

ASSESSMENT
/chat/test (Hybrid chatbot interface)
/assessment/[id] (Redirects to hybrid)

ADMIN PORTAL
/admin
├─ /dashboard (System overview)
├─ /users (User management)
└─ /analytics (System metrics)

OTHER PORTALS
/parent/dashboard (Parent view)
/school/dashboard (School view)
/dashboard (Generic dashboard)
```

---

## 🔒 Security Features

```
MULTI-LAYER VERIFICATION
┌─────────────────────────────────────┐
│ Layer 1: Secure Token               │
│ • URL-safe random token (32 chars)  │
│ • Single-use only                   │
│ • 24-hour expiration                │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Layer 2: OTP Code                   │
│ • 6-digit numeric code              │
│ • Sent via SMS/Email                │
│ • Max 3 attempts                    │
│ • Time-limited                      │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ Layer 3: Date of Birth              │
│ • Student's DOB verification        │
│ • Max 3 attempts                    │
│ • Account locks after failures      │
└─────────────────────────────────────┘
         ↓
    ✅ FULLY VERIFIED
```

---

## 📊 Data Flow

```
INPUT SOURCES
├─ Parent Assessment (Hybrid Chat)
│  ├─ MCQ responses
│  ├─ Text responses
│  └─ AI-generated follow-ups
│
├─ IQ Test Upload (PDF)
│  ├─ Cognitive profile
│  ├─ Test scores
│  └─ Recommendations
│
└─ Teacher Assessment (Future)
   └─ Classroom observations

         ↓

AI PROCESSING
├─ Natural Language Processing
├─ Pattern Recognition
├─ Severity Classification
└─ Report Generation

         ↓

OUTPUTS
├─ Comprehensive Report
│  ├─ Executive Summary
│  ├─ Detailed Analysis
│  └─ Recommendations
│
├─ Visualizations
│  └─ Charts & graphs
│
└─ Action Items
   └─ Next steps
```

---

## 🌐 Technology Stack

```
FRONTEND (Port 3000)
├─ Next.js 14 (App Router)
├─ React 18
├─ TypeScript
├─ Tailwind CSS
└─ Mobile-responsive design

BACKEND (Port 8000)
├─ FastAPI (Python)
├─ SQLAlchemy (Async ORM)
├─ PostgreSQL database
├─ Bcrypt (Password hashing)
├─ JWT (Authentication)
└─ OpenAI API (AI processing)

DATABASE
├─ users (All user accounts)
├─ students (Student profiles)
├─ assessment_assignments (Assignments)
├─ verification_tokens (Multi-layer verification)
├─ chat_sessions (Hybrid chat data)
├─ chat_messages (Conversation history)
└─ generated_reports (AI reports)
```

---

## ✅ Testing Checklist

```
AUTHENTICATION
□ Psychologist login works
□ Admin login works
□ Parent login works (auto-created accounts)
□ Invalid credentials handled gracefully
□ Password reset works

STUDENT MANAGEMENT
□ Create student (3-step wizard)
□ Add multiple parents to student
□ View student list
□ View student profile
□ Edit student information

ASSESSMENT ASSIGNMENT
□ Assign assessment to student
□ Select parent to complete it
□ Verification link generated
□ Email sent with OTP

VERIFICATION FLOW
□ OTP verification page loads
□ Valid OTP accepted
□ Invalid OTP rejected (max 3 attempts)
□ DOB verification page loads
□ Correct DOB accepted
□ Incorrect DOB rejected (max 3 attempts)
□ Fully verified → redirects to assessment

HYBRID CHAT
□ Chat interface loads
□ Bot sends initial greeting
□ MCQ questions work
□ Text input works
□ AI generates adaptive follow-up questions
□ Progress tracked
□ Assessment can be completed

REPORT GENERATION
□ AI generates report after completion
□ Psychologist can view report
□ Report can be approved
□ Report can be modified
□ Final report sent to parent

MOBILE RESPONSIVENESS
□ All pages responsive on mobile (375px)
□ Forms accessible on mobile
□ Navigation works on mobile
□ Chat interface usable on mobile

ERROR HANDLING
□ Clear error messages
□ Graceful failures
□ No console errors
□ Helpful user feedback
```

---

## 🚀 Quick Start for Testing

**1. Start Servers:**
```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**2. Test Login:**
- Open: http://localhost:3000
- Login as: psychologist@test.com / test123

**3. Create Student:**
- Click "Create New Student"
- Follow 3-step wizard
- Use sample data from TEST_CREDENTIALS.md

**4. Assign Assessment:**
- Select student
- Assign to parent
- Get verification link

**5. Complete Verification:**
- Open verification link
- Enter OTP code
- Enter student DOB

**6. Complete Assessment:**
- Answer questions in hybrid chat
- Mix of MCQ and text responses
- Submit when complete

**7. Review Report:**
- Login as psychologist
- View generated report
- Approve or modify

---

## 📝 Important Notes

- All test users are **pre-verified** (no email verification needed)
- Backend runs on **port 8000**
- Frontend runs on **port 3000**
- Database: **PostgreSQL** (edpsych_db)
- All passwords use **bcrypt** hashing
- Verification tokens expire after **24 hours**
- OTP codes are **6 digits**
- Max **3 attempts** for OTP and DOB
- Mobile breakpoint: **768px** (md:)

---

**Last Updated:** 2026-04-01
**Version:** 1.0
**Status:** Ready for Testing ✅
