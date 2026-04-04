# Parent-Student Mapping System - Implementation Status

## Overview
This document tracks the implementation of a proper parent-student relationship mapping system to address the security concern: **preventing psychologists from accidentally assigning assessments to wrong parents**.

## Problem Statement
**Original Issue**: When a psychologist creates a student, there was no permanent link between the student and their parent/guardian. This meant:
- Any parent could be assigned to any student by mistake
- No validation to check if a parent actually has authority over a student
- One parent could not have multiple children properly linked
- Schools could not manage multiple students effectively

## Solution: Student-Guardian Relationship Table
A many-to-many relationship table that maps which parents/guardians have authority over which students.

---

## ✅ COMPLETED TASKS

### 1. Database Model Created
**File**: `backend/app/models/student_guardian.py`

**Features**:
- Many-to-many relationship (one student → multiple guardians, one guardian → multiple students)
- Unique constraint prevents duplicate relationships
- Relationship type field (Mother, Father, Guardian, School, etc.)
- Primary contact flag
- Cascade deletes for data integrity
- Created by tracking for audit

**Table Structure**:
```sql
CREATE TABLE student_guardians (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50),
    is_primary VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(student_id, guardian_user_id)
);
```

### 2. API Endpoints Created
**File**: `backend/app/api/student_guardians.py`

**Endpoints**:
1. `POST /api/v1/student-guardians/` - Create a relationship (Psychologist/Admin only)
2. `GET /api/v1/student-guardians/student/{student_id}/guardians` - Get all guardians for a student
3. `GET /api/v1/student-guardians/guardian/{guardian_user_id}/students` - Get all students for a guardian
4. `DELETE /api/v1/student-guardians/{relationship_id}` - Delete a relationship (Psychologist/Admin only)
5. `GET /api/v1/student-guardians/parent-users` - Get all parent/school users for dropdown (Psychologist/Admin only)

**Security Features**:
- Psychologist/Admin only can create/delete relationships
- Parents can only view their own students
- Validates guardian must be PARENT or SCHOOL role
- Prevents duplicate relationships

### 3. Backend Integration
**Files Modified**:
- `backend/main.py` - Added student_guardians router and model import
- Server auto-reloaded with new routes

### 4. Database Migration
- Table automatically created via SQLAlchemy on server start
- Indexes created on `student_id` and `guardian_user_id` for performance

---

## ⏳ PENDING TASKS

### 5. Frontend UI for Student Creation with Parent Selection
**Location**: `frontend/app/psychologist/dashboard/page.tsx` (Students tab)

**What's Needed**:
- Add parent/guardian dropdown to student creation form
- Fetch parent users from `/api/v1/student-guardians/parent-users`
- When creating student, also create the student-guardian relationship

**Implementation**:
```typescript
// Add to student creation form:
1. Fetch parent users on component mount
2. Add dropdown: "Select Parent/Guardian (Optional)"
3. After student creation success, call:
   POST /api/v1/student-guardians/
   {
     student_id: newStudentId,
     guardian_user_id: selectedParentId,
     relationship_type: "Parent",
     is_primary: "true"
   }
```

### 6. Update Assignment Validation
**Location**: `backend/app/api/assignments.py`

**What's Needed**:
- When psychologist assigns assessment, validate that the selected parent is linked to the student
- Add check in `create_assignment` function:

```python
# Before creating assignment, verify relationship exists
relationship = await db.execute(
    select(StudentGuardian).where(
        and_(
            StudentGuardian.student_id == assignment_data.student_id,
            StudentGuardian.guardian_user_id == assignment_data.assigned_to_user_id
        )
    )
)
if not relationship.scalar_one_or_none():
    raise HTTPException(
        status_code=400,
        detail="This parent/guardian is not linked to this student. Please add them as a guardian first."
    )
```

### 7. UI for Managing Student-Guardian Relationships
**Location**: New section in psychologist dashboard

**Features Needed**:
- View all guardians for a student
- Add additional guardians to existing students
- Remove guardian relationships
- Mark primary contact

**Suggested UI Location**:
Add a "Guardians" column or button in the Students list table that opens a modal showing:
- Current guardians
- Add guardian button
- Remove guardian option

### 8. Update Students List to Show Guardian Info
**Location**: `frontend/app/psychologist/dashboard/page.tsx` (Students tab - table view)

**What's Needed**:
- Fetch guardian info for each student
- Display guardian names/emails in the table
- Show if no guardian assigned (with warning icon)

### 9. Parent Dashboard - Show Only Assigned Students
**Location**: `frontend/app/dashboard/page.tsx` (Parent view)

**What's Needed**:
- Update parent dashboard to fetch students using:
  `GET /api/v1/student-guardians/guardian/{userId}/students`
- Show only students they're linked to
- This ensures parents can't see students they shouldn't have access to

---

## WORKFLOW AFTER IMPLEMENTATION

### Complete Workflow:
1. **Psychologist creates student**
   - Fills in student details (name, DOB, grade, etc.)
   - Selects parent/guardian from dropdown (optional at creation)
   - System creates student + student-guardian relationship

2. **Psychologist assigns assessment**
   - Selects student
   - System shows ONLY parents/guardians linked to that student in dropdown
   - If no guardian linked, shows warning: "No guardians assigned to this student. Please add a guardian first."
   - Creates assignment only if valid relationship exists

3. **Parent logs in**
   - Sees only students they're linked to
   - Can complete assessments only for their students
   - Cannot access other students' information

4. **Managing Relationships**
   - Psychologist can add additional guardians (e.g., both parents)
   - Can mark one as primary contact
   - Can remove guardians if needed
   - Can view all guardians for any student

---

## TESTING CHECKLIST

- [ ] Create student with parent selection
- [ ] Create student without parent (should still work)
- [ ] Add guardian to existing student
- [ ] Try to assign assessment to linked parent (should work)
- [ ] Try to assign assessment to non-linked parent (should fail with error)
- [ ] Parent login - should see only their students
- [ ] Add multiple guardians to one student
- [ ] Add multiple students to one guardian
- [ ] Delete guardian relationship
- [ ] Try to create duplicate relationship (should fail)

---

## API DOCUMENTATION

### Create Student-Guardian Relationship
```bash
POST /api/v1/student-guardians/
Authorization: Bearer {psychologist_token}
Content-Type: application/json

{
  "student_id": "uuid",
  "guardian_user_id": "uuid",
  "relationship_type": "Mother",  // Optional
  "is_primary": "true"  // "true" or "false"
}
```

### Get Parent Users (for dropdown)
```bash
GET /api/v1/student-guardians/parent-users
Authorization: Bearer {psychologist_token}

Response:
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "PARENT"
  }
]
```

### Get Guardians for Student
```bash
GET /api/v1/student-guardians/student/{student_id}/guardians
Authorization: Bearer {token}

Response:
[
  {
    "relationship_id": "uuid",
    "guardian_id": "uuid",
    "guardian_name": "Jane Doe",
    "guardian_email": "jane@example.com",
    "guardian_role": "PARENT",
    "relationship_type": "Mother",
    "is_primary": "true"
  }
]
```

### Get Students for Guardian
```bash
GET /api/v1/student-guardians/guardian/{guardian_user_id}/students
Authorization: Bearer {token}

Response:
[
  {
    "relationship_id": "uuid",
    "student_id": "uuid",
    "student_name": "Jimmy Doe",
    "first_name": "Jimmy",
    "last_name": "Doe",
    "grade_level": "5",
    "school_name": "Lincoln Elementary",
    "relationship_type": "Son",
    "is_primary": "true"
  }
]
```

---

## BENEFITS OF THIS SYSTEM

1. **Security**: Parents can only access their own students
2. **Flexibility**: Supports multiple guardians per student (mother, father, grandparent, etc.)
3. **School Support**: Schools can manage multiple students
4. **Audit Trail**: Tracks who created each relationship
5. **Data Integrity**: Cascade deletes prevent orphaned relationships
6. **Validation**: Assignment system can verify parent has authority before allowing assessment
7. **Unique IDs**: Each student has a permanent UUID that stays with them

---

## NEXT STEPS

1. Complete frontend UI for parent selection during student creation
2. Add validation to assignment creation
3. Update parent dashboard to use new guardian endpoint
4. Add UI for managing relationships (add/remove guardians)
5. Test complete workflow end-to-end
6. Update TEST_ACCOUNTS.md with example relationships

---

## FILES TO MODIFY

**Backend** (✅ Complete):
- ✅ `backend/app/models/student_guardian.py` - CREATED
- ✅ `backend/app/api/student_guardians.py` - CREATED
- ✅ `backend/main.py` - UPDATED
- ⏳ `backend/app/api/assignments.py` - NEEDS UPDATE

**Frontend** (⏳ Pending):
- ⏳ `frontend/app/psychologist/dashboard/page.tsx` - NEEDS UPDATE
- ⏳ `frontend/app/dashboard/page.tsx` - NEEDS UPDATE (parent view)

---

## CURRENT STATUS: 60% Complete

**Backend**: 100% complete ✅
**Frontend**: 20% complete (Students tab exists, needs parent selection added)
**Validation**: 0% complete (needs implementation in assignments.py)
**Testing**: 0% complete

**Estimated Time to Complete**: 2-3 hours of development work
