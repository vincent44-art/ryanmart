# DELETE User 500 Error Fix Plan

## Issue
- DELETE `/api/users/3` returns 500 Internal Server Error
- Error: "current transaction is aborted, commands ignored until end of transaction block"
- Warning: "Could not delete from assignment: relation does not exist"

## Root Causes
1. PostgreSQL transaction enters "aborted" state after first error (undefined table)
2. All subsequent DELETEs in the same transaction fail with "InFailedSqlTransaction"
3. `safe_delete` function caught exceptions but didn't rollback/commit between operations
4. Core tables deletion and optional tables deletion shared a single transaction

## Fix Steps - COMPLETED ✅

### Step 1: Fix `backend/resources/user.py` DELETE method ✅
**Updated `safe_delete` function to:**
- Check if table exists before trying to delete (using `information_schema.tables`)
- Use separate transactions for each optional table
- Commit after each successful deletion
- Rollback on error and start fresh for next table
- Use `finally` block to ensure clean transaction state

**Changes made:**
1. Table existence check before DELETE
2. Commit after each optional table deletion
3. Proper rollback handling in finally block
4. Clean transaction state before main user deletion
5. Moved `message` recipient deletion to core tables section

### Step 2: Previous fixes retained ✅
- [x] Try/except blocks for optional tables
- [x] Proper error logging
- [x] Fallback to deactivation when deletion fails
- [x] Separation of core and optional tables

## Files Modified
1. `/home/vincent/ryanmart/backend/resources/user.py` - Fixed transaction handling in DELETE method

## Testing
- [x] Code changes applied
- [ ] Deploy to production and test DELETE /api/users/:id
- [ ] Verify delete works for users with/without related records
- [ ] Verify deactivation fallback works when deletion still fails
- [ ] Check Render logs for any remaining errors

