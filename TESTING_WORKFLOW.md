# EdPsych AI - Complete Testing Workflow

## Test Credentials

All test users have been created and are ready to use:

| Role | Email | Password |
|------|-------|----------|
| **Psychologist** | psychologist@test.com | test123 |
| **Admin** | admin@test.com | admin123 |
| **Parent** | parent@test.com | parent123 |
| **School** | school@test.com | school123 |

---

## Before Testing

Ensure both servers are running:

```bash
# Terminal 1 - Backend (Port 8000)
cd backend
python main.py

# Terminal 2 - Frontend (Port 3000)
cd frontend
npm run dev
```

Open your browser to: `http://localhost:3000`

---

## Testing Workflow 1: Psychologist Complete Workflow

### Step 1: Login as Psychologist
- [ ] Go to `http://localhost:3000`
- [ ] Click "Login as Psychologist" button
- [ ] Enter credentials:
  - Email: `psychologist@test.com`
  - Password: `test123`
- [ ] Should redirect to `/psychologist/dashboard`

**Expected Result:** Successfully logged in, viewing psychologist dashboard

---

### Step 2: Create Student with Parent(s)
- [ ] From dashboard, click "Create New Student" or go to `/psychologist/students/create`
- [ ] **Step 1 - Student Information:**
  - First Name: `John`
  - Last Name: `Doe`
  - Date of Birth: `2015-05-15` (9 years old)
  - Grade: `4th Grade`
  - School Name: `Springfield Elementary`
  - Additional Notes: `Test student for hybrid assessment`
  - Click "Next: Add Parents/Guardians"

- [ ] **Step 2 - Add Parent(s):**
  - Parent 1:
    - Full Name: `Sarah Doe`
    - Email: `sarah.doe@test.com`
    - Phone: `+1-555-1001`
    - Relationship: `Mother`
  - Click "+ Add Another Parent/Guardian" (optional)
  - Parent 2:
    - Full Name: `Michael Doe`
    - Email: `michael.doe@test.com`
    - Phone: `+1-555-1002`
    - Relationship: `Father`
  - Click "Next: Review"

- [ ] **Step 3 - Review and Submit:**
  - Review all information
  - Click "Create Student & Parents"

**Expected Result:**
- Success message displayed
- Temporary passwords shown for each parent
- Student created in database
- Parent accounts auto-created

---

### Step 3: Assign Assessment to Student
- [ ] From dashboard, click "Assign Assessment" next to the student
- [ ] Or go to `/psychologist/assessments/assign`
- [ ] Select:
  - Student: `John Doe`
  - Assessment Type: `Parent Assessment (Hybrid Chat)`
  - Assigned To: `Sarah Doe (Mother)`
  - Due Date: Choose a future date
  - Notes: `Please complete this assessment about John's behavior`
- [ ] Click "Assign Assessment"

**Expected Result:**
- Assignment created
- Email sent to parent with secure verification link
- Assignment appears in "Active Assessments" list

---

### Step 4: View Students List
- [ ] Go to `/psychologist/students`
- [ ] Should see list of all students including "John Doe"
- [ ] Click on student name to view details

**Expected Result:**
- Student profile page loads
- Shows student information, parents, and assessment history

---

### Step 5: Upload IQ Test Report (Optional)
- [ ] Go to `/psychologist/students/[student_id]/upload`
- [ ] Upload a PDF IQ test report
- [ ] System should extract cognitive profile data

**Expected Result:** IQ report uploaded and linked to student

---

### Step 6: Review Generated Reports
- [ ] Go to `/psychologist/reports`
- [ ] Once parent completes assessment, view AI-generated report
- [ ] Review and approve or request modifications

**Expected Result:** Can view, review, and approve reports

---

## Testing Workflow 2: Parent Verification & Assessment

### Step 1: Access Verification Link
Parent receives email with secure link like:
```
http://localhost:3000/verify-access/abc123xyz...
```

- [ ] Open the verification link (you'll need to get this from database or email logs)
- [ ] Should see "Step 1: OTP Verification" page

**Expected Result:** Verification page loads, showing student name and OTP instructions

---

### Step 2: Verify OTP Code
Parent receives OTP code via SMS/email (6-digit code)

- [ ] Enter the 6-digit OTP code
- [ ] Click "Verify OTP"

**Expected Result:**
- OTP verified successfully
- Redirected to `/verify-dob/[token]` (Step 2)

**Troubleshooting:** If you don't have OTP, you can find it in database:
```sql
SELECT otp_code, secure_token FROM verification_tokens
WHERE parent_user_id = (SELECT id FROM users WHERE email = 'sarah.doe@test.com');
```

---

### Step 3: Verify Date of Birth
- [ ] On DOB verification page, enter student's date of birth: `2015-05-15`
- [ ] Click "Verify Date of Birth"

**Expected Result:**
- DOB verified successfully
- Full verification complete
- Redirected to hybrid chat assessment: `/chat/test`

---

### Step 4: Complete Hybrid Assessment
- [ ] Chat interface loads
- [ ] Bot greets parent and explains the assessment
- [ ] Answer questions through:
  - Multiple choice selections
  - Text input for detailed responses
  - Follow-up adaptive questions from AI
- [ ] Complete all assessment sections:
  - Attention & Focus
  - Social Skills
  - Emotional Regulation
  - Academic Performance
  - Behavioral Patterns

**Expected Result:**
- Smooth conversation flow
- Mix of structured MCQs and open-ended questions
- AI asks relevant follow-up questions
- Progress tracked throughout

---

### Step 5: Submit Assessment
- [ ] After completing all sections, bot confirms completion
- [ ] Click "Submit Assessment"
- [ ] View confirmation page

**Expected Result:**
- Assessment marked as completed
- Psychologist notified
- AI report generation begins
- Parent can view submitted responses

---

## Testing Workflow 3: Admin Portal

### Step 1: Login as Admin
- [ ] Go to `http://localhost:3000`
- [ ] Click "Login as Admin"
- [ ] Enter credentials:
  - Email: `admin@test.com`
  - Password: `admin123`
- [ ] Should redirect to `/admin/dashboard`

**Expected Result:** Admin dashboard loads

---

### Step 2: View All Users
- [ ] Go to `/admin/users` (if exists)
- [ ] View list of all users (psychologists, parents, schools)
- [ ] Filter by role
- [ ] View user details

**Expected Result:** Complete user management interface

---

### Step 3: View System Analytics
- [ ] Go to `/admin/analytics` (if exists)
- [ ] View system statistics:
  - Total students
  - Total assessments
  - Completion rates
  - Active users

**Expected Result:** Analytics dashboard with charts and metrics

---

### Step 4: Manage Psychologists
- [ ] Create new psychologist account
- [ ] Activate/deactivate psychologist accounts
- [ ] View psychologist activity

**Expected Result:** Full admin control over psychologists

---

## Testing Workflow 4: School Portal (If Implemented)

### Step 1: Login as School
- [ ] Go to `http://localhost:3000`
- [ ] Login with:
  - Email: `school@test.com`
  - Password: `school123`
- [ ] Should redirect to `/school/dashboard`

**Expected Result:** School dashboard loads (if implemented)

---

## Testing Workflow 5: Mobile Responsiveness

Test all pages on mobile viewport (375px width):

- [ ] Homepage - All cards stack vertically
- [ ] Login page - Form centered and readable
- [ ] Psychologist dashboard - Navigation accessible
- [ ] Student creation form - All fields accessible
- [ ] Verification pages - OTP input large and clear
- [ ] Hybrid chat - Messages readable, input accessible
- [ ] Reports - Readable on small screens

**Expected Result:** All pages fully responsive on mobile devices

---

## Testing Workflow 6: Error Handling

### Test Invalid Login
- [ ] Try logging in with wrong password
- [ ] Try logging in with non-existent email

**Expected Result:** Clear error messages, no crashes

---

### Test Expired Verification Token
- [ ] Try accessing verification link after expiration (24 hours)

**Expected Result:** "Token expired" error, option to request new link

---

### Test Wrong OTP/DOB
- [ ] Enter wrong OTP code 3 times
- [ ] Enter wrong DOB 3 times

**Expected Result:**
- Clear error messages
- Account locked after max attempts
- Psychologist notified

---

### Test Incomplete Assessment
- [ ] Start assessment, close browser
- [ ] Return to assessment link later

**Expected Result:** Resume from where left off

---

## Testing Checklist Summary

### Core Features
- [ ] User authentication (all roles)
- [ ] Student creation with multiple parents
- [ ] Assessment assignment workflow
- [ ] Multi-layer verification (OTP + DOB)
- [ ] Hybrid chat assessment
- [ ] AI-powered adaptive questions
- [ ] Report generation and review
- [ ] Mobile responsiveness

### Security Features
- [ ] Secure token generation
- [ ] OTP verification
- [ ] DOB verification
- [ ] Rate limiting on verification attempts
- [ ] Secure password hashing (bcrypt)
- [ ] Role-based access control

### User Experience
- [ ] Clear navigation
- [ ] Helpful error messages
- [ ] Progress indicators
- [ ] Responsive design
- [ ] Accessibility features

---

## Quick Test Commands

### Check Backend API
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/docs
```

### Check Database Tables
```bash
# Connect to PostgreSQL
psql -U postgres -d edpsych_db

# List all tables
\dt

# Check users
SELECT email, role, is_verified FROM users;

# Check students
SELECT student_first_name, student_last_name, date_of_birth FROM students;

# Check verification tokens
SELECT secure_token, otp_code, is_fully_verified FROM verification_tokens;

# Check assessments
SELECT id, status, created_at FROM assessment_assignments;
```

### View Backend Logs
```bash
# Backend logs should show:
# - API requests
# - Database queries
# - OTP generation
# - Email sending
# - Verification attempts
```

---

## Common Issues & Solutions

### Issue: Can't login
**Solution:**
- Verify user exists: Check database
- Try resetting password using script
- Check backend logs for authentication errors

### Issue: Verification link doesn't work
**Solution:**
- Check token hasn't expired
- Verify token exists in database
- Check backend verification API endpoints

### Issue: Frontend not loading
**Solution:**
```bash
cd frontend
rm -rf .next
npm run dev
```

### Issue: Backend API not responding
**Solution:**
```bash
# Restart backend
cd backend
python main.py
```

### Issue: Database connection error
**Solution:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database exists: `psql -l`

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Remove test students
DELETE FROM students WHERE student_first_name = 'John' AND student_last_name = 'Doe';

-- Remove test parents (auto-created)
DELETE FROM users WHERE email LIKE '%.doe@test.com';

-- Remove verification tokens
DELETE FROM verification_tokens WHERE created_at < NOW();

-- Keep main test users for future testing
-- (psychologist@test.com, admin@test.com, etc.)
```

---

## Success Criteria

Testing is successful when:

1. ✅ All 4 test accounts can login
2. ✅ Psychologist can create students with parents
3. ✅ Psychologist can assign assessments
4. ✅ Parents can complete multi-layer verification
5. ✅ Parents can complete hybrid chat assessment
6. ✅ AI generates adaptive questions during chat
7. ✅ Reports are generated after assessment completion
8. ✅ Psychologist can review and approve reports
9. ✅ All pages are mobile-responsive
10. ✅ No console errors or crashes

---

## Next Steps After Testing

1. Deploy to staging environment
2. Invite real psychologists for beta testing
3. Gather feedback on UX
4. Refine AI prompts and question flow
5. Add more assessment templates
6. Implement email notifications
7. Add analytics dashboard
8. Production deployment

---

**Testing Notes:**
- Document any bugs found
- Take screenshots of errors
- Note browser/device used
- Check browser console for errors
- Monitor backend logs during testing

---

**Last Updated:** 2026-04-01
**Tested By:** _______________
**Test Environment:** Local Development (localhost)
