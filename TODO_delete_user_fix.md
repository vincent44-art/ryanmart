# DELETE User 500 Error Fix Plan

## Issue
- DELETE `/api/users/3` returns 500 Internal Server Error
- Error message "dn" indicates JSON parsing failed (server returned HTML)

## Root Causes
1. `user.py` delete method tries to delete from tables that may not exist in production
2. Missing try/except blocks for tables that may not exist in production
3. Foreign key constraint failures not handled properly
4. Poor error logging makes debugging difficult

## Fix Steps - COMPLETED

### Step 1: Fix `backend/resources/user.py` DELETE method ✅
- [x] Added try/except blocks for optional tables (gradients, it_event, etc.)
- [x] Added proper error logging
- [x] Made fallback to deactivation more robust
- [x] Separated core tables from optional tables
- [x] Added safe_delete helper function for optional tables

### Step 2: Improve frontend error handling ✅
- [x] Better error message extraction from API response
- [x] Handle warning responses (deactivation fallback)
- [x] Refresh users list after deactivation

### Step 3: Files Modified
1. `/home/vincent/ryanmart/backend/resources/user.py` - Improved DELETE with safe error handling
2. `/home/vincent/ryanmart/frontend/src/contexts/AuthContext.jsx` - Better error handling

## Testing
- [ ] Deploy to production and test DELETE /api/users/:id
- [ ] Verify delete works for users without related records
- [ ] Verify deactivation fallback works when deletion fails
- [ ] Check Render logs for any remaining errors

