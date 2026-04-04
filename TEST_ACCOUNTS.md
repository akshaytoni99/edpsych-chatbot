# EdPsych AI - Test Account Credentials

This file contains all test account credentials for the EdPsych AI platform. These accounts have been pre-seeded into the database for testing purposes.

---

## Parent Accounts (4 accounts)

### Parent 1
- **Name:** Sarah Johnson
- **Email:** `parent1@test.com`
- **Password:** `Parent@123`
- **Phone:** +1-555-0101
- **Role:** Parent

### Parent 2
- **Name:** Michael Chen
- **Email:** `parent2@test.com`
- **Password:** `Parent@123`
- **Phone:** +1-555-0102
- **Role:** Parent

### Parent 3
- **Name:** Emily Rodriguez
- **Email:** `parent3@test.com`
- **Password:** `Parent@123`
- **Phone:** +1-555-0103
- **Role:** Parent

### Parent 4
- **Name:** David Thompson
- **Email:** `parent4@test.com`
- **Password:** `Parent@123`
- **Phone:** +1-555-0104
- **Role:** Parent

---

## Psychologist Accounts (3 accounts)

### Dr. Smith
- **Name:** Dr. Jennifer Smith
- **Email:** `dr.smith@test.com`
- **Password:** `Doctor@123`
- **Phone:** +1-555-0201
- **Organization:** Mindful Psychology Clinic
- **Role:** Psychologist

### Dr. Patel
- **Name:** Dr. Raj Patel
- **Email:** `dr.patel@test.com`
- **Password:** `Doctor@123`
- **Phone:** +1-555-0202
- **Organization:** Child Development Center
- **Role:** Psychologist

### Dr. Williams
- **Name:** Dr. Amanda Williams
- **Email:** `dr.williams@test.com`
- **Password:** `Doctor@123`
- **Phone:** +1-555-0203
- **Organization:** Educational Psychology Associates
- **Role:** Psychologist

---

## Admin Accounts (2 accounts)

### Admin 1
- **Name:** System Administrator
- **Email:** `admin1@test.com`
- **Password:** `Admin@123`
- **Phone:** +1-555-0301
- **Organization:** EdPsych AI
- **Role:** Admin

### Admin 2
- **Name:** Platform Manager
- **Email:** `admin2@test.com`
- **Password:** `Admin@123`
- **Phone:** +1-555-0302
- **Organization:** EdPsych AI
- **Role:** Admin

---

## Quick Reference Table

| Role | Email | Password | Name |
|------|-------|----------|------|
| Parent | parent1@test.com | Parent@123 | Sarah Johnson |
| Parent | parent2@test.com | Parent@123 | Michael Chen |
| Parent | parent3@test.com | Parent@123 | Emily Rodriguez |
| Parent | parent4@test.com | Parent@123 | David Thompson |
| Psychologist | dr.smith@test.com | Doctor@123 | Dr. Jennifer Smith |
| Psychologist | dr.patel@test.com | Doctor@123 | Dr. Raj Patel |
| Psychologist | dr.williams@test.com | Doctor@123 | Dr. Amanda Williams |
| Admin | admin1@test.com | Admin@123 | System Administrator |
| Admin | admin2@test.com | Admin@123 | Platform Manager |

---

## Application URLs

- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

---

## Testing Workflow

### Complete Assessment Flow Test

1. **Login as Psychologist** (e.g., dr.smith@test.com)
2. **Create a Student**
   - Add student details (name, DOB, school, etc.)
3. **Assign Assessment to Parent**
   - Go to "Assign Assessment" page
   - Select the student
   - Select a parent (e.g., parent1@test.com)
   - Add optional notes and due date
   - Submit assignment
4. **Logout and Login as Parent** (e.g., parent1@test.com)
5. **View Assignment**
   - Check dashboard for assigned assessment
   - Click "Start Assessment" button
6. **Complete Assessment**
   - Answer all 12 questions
   - System tracks progress automatically
   - Auto-redirects to reports page when complete
7. **View Results**
   - Reports page shows completed assessment
   - (Report generation feature to be implemented)

### Role-Specific Features

**Psychologist:**
- Create and manage students
- Assign assessments to parents/schools
- View all assignments
- Review reports (when implemented)

**Parent:**
- View assigned assessments only
- Take assessments for assigned students
- View reports for their students

**Admin:**
- Full system access
- Manage all users
- View all data

---

## Notes

- All accounts are pre-verified and active
- Passwords follow secure format requirements
- Database was reset and re-seeded on: 2026-03-31
- Total accounts created: 9 (4 Parents + 3 Psychologists + 2 Admins)

---

## Security Notice

**WARNING:** These are test credentials only. Do not use these accounts in production environments. All passwords should be changed in production deployments.

---

*Last Updated: 2026-03-31*
