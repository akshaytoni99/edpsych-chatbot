# Invite Parent Feature Documentation

## Problem Solved

**Original Issue**: When a psychologist creates a student but the parent hasn't registered in the system yet, the psychologist cannot assign an assessment because:
1. There are no guardians linked to the student
2. The system requires a valid guardian-student relationship before allowing assignment

**Solution**: "Invite Parent" feature that allows psychologists to create parent accounts on-the-fly and automatically link them to students.

## How It Works

### Backend API Endpoint

**Endpoint**: `POST /api/v1/student-guardians/invite-parent`

**Request Body**:
```json
{
  "student_id": "uuid",
  "parent_email": "string",
  "parent_name": "string",
  "relationship_type": "Mother|Father|Guardian|Grandparent|Other",
  "is_primary": "true|false"
}
```

**Logic Flow**:
1. Verifies student exists
2. Checks if parent email already exists in system:
   - **If YES**: Links existing parent to student
   - **If NO**: Creates new parent account with temporary password + links to student
3. Returns parent info including temporary password (for new accounts)

**Response (New Parent)**:
```json
{
  "message": "Parent account created and linked to student successfully",
  "parent": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "temporary_password": "Parent1234!",
    "already_existed": false
  },
  "note": "Please share these credentials with the parent..."
}
```

**Response (Existing Parent)**:
```json
{
  "message": "Existing parent linked to student successfully",
  "parent": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "already_existed": true
  }
}
```

### Frontend UI

**Location**: Psychologist Dashboard > Assignments Tab

**When Displayed**: When a student is selected but has no guardians linked

**UI Components**:
1. **Warning Message**: Yellow alert box explaining no guardians are linked
2. **"+ Invite & Link Parent" Button**: Toggles invite form
3. **Invite Form** (when clicked):
   - Parent Email (required)
   - Parent Name (required)
   - Relationship Type (dropdown: Mother, Father, Guardian, Grandparent, Other)
   - "Invite & Link Parent" submit button

**User Flow**:
1. Psychologist selects student with no guardians
2. Sees warning: "⚠️ No Guardians Linked"
3. Clicks "+ Invite & Link Parent"
4. Fills out form:
   - Email: parent@example.com
   - Name: Jane Doe
   - Relationship: Mother
5. Clicks "Invite & Link Parent"
6. Alert shows success message with credentials (if new account)
7. Student list refreshes showing new guardian

## Security Features

✅ **Email Validation**: Checks if email is already in system
✅ **Role Verification**: Ensures existing users with that email are parents/schools
✅ **Unique Constraints**: Prevents duplicate guardian-student relationships
✅ **Temporary Password**: Secure random password generated (e.g., "Parent8472!")
✅ **Authorization**: Only psychologists/admins can invite parents

## Temporary Password Format

- Pattern: `Parent{random 4-digit number}!`
- Example: `Parent3847!`, `Parent0192!`
- Generated using Python's `secrets` module
- Hashed before storage using bcrypt

## Benefits

1. **No Registration Barrier**: Psychologists can immediately create parent accounts
2. **Streamlined Workflow**: No need to wait for parents to self-register
3. **Automatic Linking**: Parent is linked to student in one step
4. **Handles Both Cases**: Works for new and existing parent emails
5. **Secure**: Parents get temporary password they can change on first login

## Files Modified

### Backend
- **`backend/app/api/student_guardians.py`** (Lines 279-416)
  - Added `InviteParentRequest` Pydantic schema
  - Added `invite_parent_and_link()` endpoint
  - Handles existing vs new parent logic
  - Generates temporary passwords

### Frontend
- **`frontend/app/psychologist/dashboard/page.tsx`**
  - Added invite parent state (lines 89-95)
  - Added `handleInviteParent()` function (lines 448-509)
  - Updated guardian selection UI (lines 1047-1124)
  - Shows invite form when no guardians exist

## Testing Steps

1. Login as psychologist (dr.smith@test.com / Doctor@123)
2. Go to Assignments tab
3. Click "Create New Assessment"
4. Select a student with no guardians
5. You'll see "⚠️ No Guardians Linked" message
6. Click "+ Invite & Link Parent"
7. Fill in:
   - Email: newparent@test.com
   - Name: New Parent
   - Relationship: Mother
8. Click "Invite & Link Parent"
9. Alert shows: "Parent account created... Email: newparent@test.com, Temporary Password: Parent####!"
10. Note the credentials
11. Now you can select that parent from the guardian dropdown
12. Assign the assessment

## Edge Cases Handled

✅ **Parent email already exists**: Links existing parent to student
✅ **Email belongs to non-parent**: Returns error message
✅ **Relationship already exists**: Returns "already linked" message
✅ **Student doesn't exist**: Returns 404 error
✅ **Missing required fields**: Validation error before API call

## Future Enhancements

🔲 **Email Sending**: Automatically email credentials to parent
🔲 **Password Reset**: Force password change on first login
🔲 **Bulk Invite**: Import CSV of parent emails
🔲 **SMS Option**: Send credentials via SMS
🔲 **QR Code**: Generate QR code with credentials for easy mobile login

## API Documentation

**Endpoint**: `/api/v1/student-guardians/invite-parent`
**Method**: POST
**Authentication**: Bearer token (Psychologist or Admin)
**Rate Limit**: None currently

**Status Codes**:
- `201 Created`: Parent invited and linked successfully
- `400 Bad Request`: Email belongs to non-parent user
- `404 Not Found`: Student not found
- `403 Forbidden`: Not authorized (not psychologist/admin)
- `422 Validation Error`: Missing required fields

## Related Features

- **Guardian Management**: View/add/remove guardians in Students tab
- **Assignment Validation**: Verifies guardian relationship before allowing assignment
- **Student Creation**: Can add guardian during student creation
- **Parent Dashboard**: Parents see only their linked students

## Conclusion

This feature removes a major friction point in the workflow, allowing psychologists to quickly onboard parents into the system without requiring them to self-register first. The automatic linking ensures proper security relationships are maintained while streamlining the assessment assignment process.
