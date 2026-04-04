# 🔐 EdPsych AI - Role-Based Access Control (RBAC)

## Complete Permissions Matrix

| Feature | PARENT | SCHOOL | PSYCHOLOGIST | ADMIN |
|---------|--------|--------|--------------|-------|
| **Student Management** |
| Add Students | ✅ Own children | ✅ Own school | ❌ View only | ✅ All students |
| View Students | ✅ Own children | ✅ Own school | ✅ All students | ✅ All students |
| Edit Students | ✅ Own children | ✅ Own school | ❌ No | ✅ All students |
| Delete Students | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Assessment Management** |
| Attend/Take Assessments | ✅ **Yes** | ✅ **Yes** | ❌ No | ✅ View only |
| Assign Assessments | ❌ No | ❌ No | ✅ **Yes** | ✅ Yes |
| View Assessment Progress | ✅ Own students | ✅ Own school | ✅ All assessments | ✅ All assessments |
| **Report Management** |
| View Final Reports | ✅ Own students (approved only) | ✅ Own school (approved only) | ✅ **All reports** | ✅ **All reports** |
| Review/Edit Reports | ❌ No | ❌ No | ✅ **Yes** | ✅ Yes |
| Approve Reports | ❌ No | ❌ No | ✅ **Yes** | ✅ Yes |
| Generate Reports | ❌ Auto | ❌ Auto | ✅ Manual trigger | ✅ Manual trigger |
| **User Management** |
| Create Users | ❌ No | ❌ No | ❌ No | ✅ **Yes** |
| Edit Users | ❌ Own profile | ❌ Own profile | ❌ Own profile | ✅ **All users** |
| Delete Users | ❌ No | ❌ No | ❌ No | ✅ **Yes** |
| Activate/Deactivate Users | ❌ No | ❌ No | ❌ No | ✅ **Yes** |
| **System Management** |
| View System Stats | ❌ No | ✅ Limited | ✅ Limited | ✅ **Full access** |
| System Configuration | ❌ No | ❌ No | ❌ No | ✅ **Yes** |
| Audit Logs | ❌ No | ❌ No | ❌ No | ✅ **Yes** |

---

## Detailed Role Descriptions

### 👨‍👩‍👧 **PARENT Role**

**Primary Purpose:** Manage own children and complete assessments

**Dashboard:** `/dashboard`

**Permissions:**
- ✅ Add/edit/view own children's profiles
- ✅ **Attend assessments** for own children
- ✅ View **final approved reports** for own children
- ✅ View assessment progress for own children
- ❌ Cannot assign assessments (done by psychologist)
- ❌ Cannot review or edit reports
- ❌ Cannot access other students' data

**Workflow:**
1. Add student (child) profile
2. Wait for psychologist to assign assessment
3. Complete assessment questions
4. View AI-generated report (after psychologist approval)

---

### 🏫 **SCHOOL Role**

**Primary Purpose:** Monitor school students and attend assessments

**Dashboard:** `/school/dashboard`

**Permissions:**
- ✅ Add/edit students from their school
- ✅ **Attend assessments** for school students
- ✅ View **final approved reports** for school students
- ✅ View student directory with parent contacts
- ✅ Filter students by grade level
- ✅ View assessment statistics for school
- ❌ Cannot assign assessments (done by psychologist)
- ❌ Cannot review or edit reports
- ❌ Cannot access students from other schools

**Workflow:**
1. Register students from their institution
2. Complete assessments when assigned
3. View approved reports for monitoring
4. Track overall school assessment progress

---

### 🧠 **PSYCHOLOGIST Role**

**Primary Purpose:** Assign assessments, review AI reports, approve final reports

**Dashboard:** `/psychologist/dashboard`

**Permissions:**
- ✅ View all students across all schools/parents
- ✅ **Assign assessments** to parents and schools
- ✅ View **all reports** (pending, draft, approved)
- ✅ **Review AI-generated reports**
- ✅ **Edit report content** (profile, impact, recommendations)
- ✅ **Approve reports** for parent/school viewing
- ✅ View all assessment progress
- ❌ Cannot take assessments (observation only)
- ❌ Cannot delete users or manage system settings

**Workflow:**
1. Review pending assessment requests
2. Assign assessments to parents/schools
3. Monitor assessment completion
4. Review AI-generated reports
5. Edit/refine reports if needed
6. Approve reports for distribution
7. Parent/School can now view final report

---

### 🔧 **ADMIN Role**

**Primary Purpose:** Master control over entire system

**Dashboard:** `/admin/dashboard`

**Permissions:**
- ✅ **Full user management** (create, edit, delete, activate/deactivate)
- ✅ View all students across entire system
- ✅ View all assessments and reports
- ✅ Assign assessments (override psychologist)
- ✅ Review and approve reports (override psychologist)
- ✅ **System-wide statistics** and analytics
- ✅ System configuration and settings
- ✅ Audit logs and monitoring
- ✅ Manage psychologist assignments
- ⚠️ **Cannot delete or deactivate own account** (safety)

**Workflow:**
1. Create and manage user accounts (parents, schools, psychologists, admins)
2. Monitor system-wide statistics
3. Override or assist psychologists with report reviews
4. Handle escalations and system issues
5. Configure platform settings
6. Monitor audit logs and user activity

---

## Access Control Implementation

### Frontend Route Protection

```typescript
// Parent Dashboard
if (!token || !userData) {
  router.push("/login");
}

// School Dashboard
if (parsedUser.role !== "SCHOOL") {
  router.push("/dashboard");
}

// Psychologist Dashboard
if (parsedUser.role !== "PSYCHOLOGIST") {
  router.push("/dashboard");
}

// Admin Dashboard
if (parsedUser.role !== "ADMIN") {
  router.push("/dashboard");
}
```

### Backend API Protection

```python
# Admin-only endpoint
@router.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all users (admin only)"""
    ...

# Psychologist or Admin
@router.get("/reports/all")
async def get_all_reports(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["PSYCHOLOGIST", "ADMIN"]:
        raise HTTPException(status_code=403)
    ...

# Parent/School can only access own data
@router.get("/students/{student_id}")
async def get_student(
    student_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    if (student.created_by_user_id != current_user.id and
        current_user.role not in ["PSYCHOLOGIST", "ADMIN", "SCHOOL"]):
        raise HTTPException(status_code=403)
    ...
```

---

## Key Security Rules

1. **Self-Protection:** Admins cannot deactivate or delete their own accounts
2. **Data Isolation:** Parents and Schools can only access their own students
3. **Report Approval Flow:** Only psychologists can approve reports for parent/school viewing
4. **Assessment Assignment:** Only psychologists (and admins) can assign assessments
5. **Audit Trail:** All critical actions logged (admin can view)

---

## User Journey Examples

### Parent Journey
```
Login → Dashboard → View Students → Wait for Assessment Assignment →
Complete Assessment → AI Generates Report → Wait for Psychologist Approval →
View Final Report
```

### School Journey
```
Login → School Dashboard → Add School Students → Filter by Grade →
Complete Assigned Assessments → View Approved Reports → Monitor Progress
```

### Psychologist Journey
```
Login → Psychologist Dashboard → View Pending Assessments →
Assign to Parent/School → Monitor Completion → Review AI Report →
Edit if Needed → Approve Report → Parent/School Notified
```

### Admin Journey
```
Login → Admin Dashboard → Create Users (All Roles) → Monitor System Stats →
Override Report Approvals → Manage User Access → Configure System Settings →
View Audit Logs
```

---

## Database Role Values

```sql
CREATE TYPE userrole AS ENUM (
    'PARENT',
    'SCHOOL',
    'PSYCHOLOGIST',
    'ADMIN'
);
```

---

## Future Enhancements

- [ ] Assessment assignment workflow (psychologist → parent/school)
- [ ] Notification system for assessment assignments
- [ ] Email alerts when reports are approved
- [ ] Bulk assessment assignments for schools
- [ ] Parent/School messaging with psychologist
- [ ] Assessment scheduling and reminders
- [ ] Multi-school management for school districts
- [ ] Psychologist workload balancing
- [ ] Custom report templates per psychologist
- [ ] Export reports to PDF

---

**Last Updated:** 2026-03-31
**Version:** 1.0
**Status:** ✅ Implemented
