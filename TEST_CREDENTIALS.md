# EdPsych AI - Test Credentials & Quick Reference

## 🚀 Quick Start

**Frontend:** http://localhost:3000
**Backend API:** http://localhost:8000
**API Docs:** http://localhost:8000/api/docs

---

## 🔐 Test Credentials

All users are **verified** and **active** - ready to use!

### Psychologist Account
```
Email:    psychologist@test.com
Password: test123
Role:     PSYCHOLOGIST
Name:     Dr. Sarah Johnson
Phone:    +1-555-0101
```
**Access:** Full psychologist dashboard, student management, assessment assignment

---

### Admin Account
```
Email:    admin@test.com
Password: admin123
Role:     ADMIN
Name:     Admin User
Phone:    +1-555-0100
```
**Access:** Full system control, user management, analytics

---

### Parent Account
```
Email:    parent@test.com
Password: parent123
Role:     PARENT
Name:     Jane Smith
Phone:    +1-555-0102
```
**Access:** Parent dashboard (limited - mainly for verification testing)

---

### School Account
```
Email:    school@test.com
Password: school123
Role:     SCHOOL
Name:     Springfield High School
Phone:    +1-555-0103
```
**Access:** School dashboard (if implemented)

---

## 📋 All Pages in Application

### Public Pages
- `http://localhost:3000` - Homepage
- `http://localhost:3000/login` - Login
- `http://localhost:3000/register` - Registration

### Psychologist Portal
- `http://localhost:3000/psychologist/dashboard` - Main dashboard
- `http://localhost:3000/psychologist/students` - Students list
- `http://localhost:3000/psychologist/students/create` - Create student with parents
- `http://localhost:3000/psychologist/students/[id]` - Student profile
- `http://localhost:3000/psychologist/students/[id]/upload` - Upload IQ report
- `http://localhost:3000/psychologist/assessments` - Assessment management
- `http://localhost:3000/psychologist/reports` - View/review reports

### Parent/School Verification Flow
- `http://localhost:3000/verify-access/[token]` - Step 1: OTP verification
- `http://localhost:3000/verify-dob/[token]` - Step 2: DOB verification

### Assessment Pages
- `http://localhost:3000/chat/test` - Hybrid chat assessment
- `http://localhost:3000/assessment/[id]` - Traditional assessment (redirects to hybrid)

### Admin Portal
- `http://localhost:3000/admin/dashboard` - Admin dashboard
- `http://localhost:3000/admin/users` - User management (if exists)

### Other Dashboards
- `http://localhost:3000/parent/dashboard` - Parent dashboard
- `http://localhost:3000/school/dashboard` - School dashboard
- `http://localhost:3000/dashboard` - Generic dashboard

### Student Pages
- `http://localhost:3000/student/[id]` - Student profile
- `http://localhost:3000/student/[id]/reports` - Student reports

---

## 🧪 Quick API Tests

### Test Login (Psychologist)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"psychologist@test.com","password":"test123"}'
```

### Test Login (Admin)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Health Check
```bash
curl http://localhost:8000/api/health
```

### View API Documentation
Open in browser: http://localhost:8000/api/docs

---

## 📊 Database Quick Commands

### Connect to Database
```bash
psql -U postgres -d edpsych_db
```

### Check Test Users
```sql
SELECT
    email,
    role,
    full_name,
    is_verified,
    is_active
FROM users
WHERE email LIKE '%@test.com';
```

### View All Tables
```sql
\dt
```

### Check Students
```sql
SELECT
    student_first_name,
    student_last_name,
    date_of_birth,
    grade_level
FROM students;
```

### Check Assessment Assignments
```sql
SELECT
    id,
    student_id,
    status,
    assigned_at
FROM assessment_assignments;
```

### Check Verification Tokens
```sql
SELECT
    secure_token,
    otp_code,
    is_otp_verified,
    is_dob_verified,
    is_fully_verified,
    expires_at
FROM verification_tokens;
```

---

## 🎯 Testing Priority Order

1. **Login Test** - Verify all 4 accounts can login
2. **Psychologist Dashboard** - Check dashboard loads
3. **Create Student** - Test 3-step student creation wizard
4. **Assign Assessment** - Assign assessment to student
5. **Verification Flow** - Test OTP + DOB verification
6. **Hybrid Chat** - Complete assessment via chatbot
7. **Mobile Test** - Test on mobile viewport (375px)
8. **Error Handling** - Test invalid inputs

---

## ⚠️ Common Test Scenarios

### Scenario 1: New Student Workflow
1. Login as psychologist
2. Create student "John Doe" with parent "Sarah Doe"
3. Assign parent assessment
4. Get verification link from database
5. Complete OTP + DOB verification
6. Complete hybrid chat assessment

### Scenario 2: Error Testing
1. Try wrong password (should fail gracefully)
2. Try expired verification token
3. Enter wrong OTP 3 times (should lock)
4. Enter wrong DOB 3 times (should lock)

### Scenario 3: Mobile Testing
1. Set browser width to 375px
2. Navigate through all pages
3. Verify responsive layout
4. Test forms on mobile

---

## 🐛 Debugging Tips

### Frontend Issues
```bash
# Check frontend console
Open DevTools → Console tab

# Check Network tab
Open DevTools → Network tab → Filter "Fetch/XHR"

# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

### Backend Issues
```bash
# Check backend logs
Look at terminal running "python main.py"

# Test API directly
curl http://localhost:8000/api/docs

# Check database connection
psql -U postgres -l
```

### Authentication Issues
```bash
# Verify user exists
psql -U postgres -d edpsych_db
SELECT email, role FROM users WHERE email = 'psychologist@test.com';

# Check password hash
SELECT password_hash FROM users WHERE email = 'psychologist@test.com';
```

---

## 📝 Test Data for Student Creation

Use this sample data when creating test students:

**Student Information:**
- First Name: `John`
- Last Name: `Doe`
- Date of Birth: `2015-05-15` (9 years old)
- Grade: `4th Grade`
- School: `Springfield Elementary`

**Parent 1:**
- Name: `Sarah Doe`
- Email: `sarah.doe@test.com`
- Phone: `+1-555-1001`
- Relationship: `Mother`

**Parent 2:**
- Name: `Michael Doe`
- Email: `michael.doe@test.com`
- Phone: `+1-555-1002`
- Relationship: `Father`

---

## ✅ Success Checklist

- [ ] All 4 test accounts login successfully
- [ ] Psychologist can view dashboard
- [ ] Student creation wizard works (3 steps)
- [ ] Assessment assignment works
- [ ] Verification link generated
- [ ] OTP verification works
- [ ] DOB verification works
- [ ] Hybrid chat loads
- [ ] Chat conversation flows naturally
- [ ] Assessment can be completed
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Error messages clear and helpful

---

## 🔄 Reset Test Data

If you need to start fresh:

```sql
-- Remove test students
DELETE FROM students WHERE student_first_name = 'John';

-- Remove auto-created parent accounts
DELETE FROM users WHERE email LIKE '%.doe@test.com';

-- Keep main test accounts
-- (Don't delete psychologist@test.com, admin@test.com, etc.)
```

---

## 📞 Support

**Backend API Logs:** Check terminal running `python main.py`
**Frontend Logs:** Check browser console (F12)
**Database Logs:** Check PostgreSQL logs

**Documentation:**
- Full Testing Workflow: `TESTING_WORKFLOW.md`
- API Documentation: http://localhost:8000/api/docs

---

**Last Updated:** 2026-04-01
**Version:** 1.0
**Environment:** Local Development
