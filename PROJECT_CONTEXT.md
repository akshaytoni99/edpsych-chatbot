# EdPsych AI Project Context

## Last Updated: 2026-04-01
**Last Session Model:** Claude Sonnet 4.5

---

## Project Overview

EdPsych AI is an educational psychology assessment platform with:
- Multi-role system (Psychologist, Parent, School, Admin)
- Multi-layer verification (OTP + DOB)
- Hybrid AI-powered chatbot for assessments
- Comprehensive report generation

---

## Current Status

### Servers Running
- **Frontend:** http://localhost:3000 (Next.js 14)
- **Backend:** http://localhost:8000 (FastAPI)
- **Database:** PostgreSQL (edpsych_db)

### Test Users Created
All users verified and active:
- `psychologist@test.com` / `test123` (PSYCHOLOGIST role)
- `admin@test.com` / `admin123` (ADMIN role)
- `parent@test.com` / `parent123` (PARENT role)
- `school@test.com` / `school123` (SCHOOL role)

Created by: `/backend/create_test_users.py`

---

## Files Created/Modified in Last Session

### Frontend Pages Created
1. `/frontend/app/verify-access/[token]/page.tsx` - OTP verification (Step 1)
2. `/frontend/app/verify-dob/[token]/page.tsx` - DOB verification (Step 2)
3. `/frontend/app/psychologist/students/create/page.tsx` - 3-step student creation wizard

### Frontend Pages Modified
1. `/frontend/app/page.tsx` - Complete rewrite with 3 portals (Psychologist, Parent/School, Admin)
   - Added "How It Works" section
   - Made mobile-responsive
   - Added role-based auto-redirect

### Backend Files
1. `/backend/app/models/__init__.py` - Fixed missing AssessmentAssignment import
2. `/backend/create_test_users.py` - New script to create test users

### Documentation Created
1. `TESTING_WORKFLOW.md` - Comprehensive testing guide with 6 workflows
2. `TEST_CREDENTIALS.md` - Quick reference for credentials and URLs
3. `WORKFLOW_SUMMARY.md` - Visual workflow diagrams
4. `PROJECT_CONTEXT.md` - This file (for context transfer)

---

## Mobile Responsiveness Updates

All pages updated with Tailwind responsive classes:
- Text sizes: `text-4xl md:text-6xl`
- Grid layouts: `grid-cols-1 md:grid-cols-3`
- Padding: `p-6 md:p-8`
- Icons: `w-16 h-16 md:w-20 md:h-20`
- Breakpoint: 768px (md:)

---

## Complete Page List (16 Pages)

### Public
- `/` - Homepage
- `/login` - Login
- `/register` - Registration

### Psychologist Portal
- `/psychologist/dashboard` - Dashboard
- `/psychologist/students` - Students list
- `/psychologist/students/create` - Create student
- `/psychologist/students/[id]` - Student profile
- `/psychologist/students/[id]/upload` - Upload IQ

### Verification Flow
- `/verify-access/[token]` - OTP verification
- `/verify-dob/[token]` - DOB verification

### Assessment
- `/chat/test` - Hybrid chat
- `/assessment/[id]` - Traditional (redirects)

### Other Dashboards
- `/admin/dashboard` - Admin
- `/parent/dashboard` - Parent
- `/school/dashboard` - School
- `/dashboard` - Generic

### Student Pages
- `/student/[id]` - Profile
- `/student/[id]/reports` - Reports

---

## Key Workflows Implemented

### 1. Psychologist Workflow
- Login → Dashboard
- Create student with parents (3-step wizard)
- Assign assessment
- Review AI reports

### 2. Parent Verification (Multi-layer)
- Receive secure link via email
- Step 1: Enter 6-digit OTP
- Step 2: Enter student DOB
- Redirect to hybrid chat assessment

### 3. Hybrid Chat Assessment
- AI-powered conversational assessment
- Mix of MCQ and text responses
- Adaptive follow-up questions
- Progress tracking

---

## Technical Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Mobile-responsive

### Backend
- FastAPI (Python)
- SQLAlchemy (Async)
- PostgreSQL
- Bcrypt 5.0.0
- JWT auth
- OpenAI API

### Key Models
- User (all roles)
- Student
- AssessmentAssignment
- VerificationToken
- ChatSession
- ChatMessage

---

## Issues Fixed

1. **AssessmentAssignment Import**
   - File: `/backend/app/models/__init__.py`
   - Added missing import on line 5
   - Fixed SQLAlchemy relationship error

2. **Mobile Responsiveness**
   - Updated all key pages
   - Added Tailwind responsive classes
   - Tested at 375px mobile width

---

## Testing Status

### Completed
- ✅ Test user creation script works
- ✅ All 4 test accounts can login
- ✅ API authentication verified
- ✅ Frontend pages created
- ✅ Mobile responsiveness added

### Ready to Test
- ⏳ Complete psychologist workflow
- ⏳ Parent verification flow (OTP + DOB)
- ⏳ Hybrid chat assessment
- ⏳ Report generation
- ⏳ Error handling

---

## Next Steps

1. Test complete workflows with test credentials
2. Verify multi-layer verification works
3. Test hybrid chat AI responses
4. Check report generation
5. Test mobile experience
6. Document any bugs found

---

## Quick Commands

### Test API Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"psychologist@test.com","password":"test123"}'
```

### Check Database
```sql
SELECT email, role FROM users WHERE email LIKE '%@test.com';
SELECT secure_token, otp_code FROM verification_tokens;
```

### Frontend Testing
1. Open http://localhost:3000
2. Login as psychologist@test.com / test123
3. Create student "John Doe"
4. Assign assessment

---

## Important Notes

- All test users are pre-verified (is_verified = true)
- Passwords use bcrypt hashing
- Verification tokens expire after 24 hours
- OTP codes are 6 digits
- Max 3 attempts for OTP and DOB
- Backend needs restart for new API endpoints

---

**Use this file to quickly get Opus 4 up to speed in a new conversation!**