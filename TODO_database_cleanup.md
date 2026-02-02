# Database Cleanup - Keep Only dennisceo@ryanmart.com

## Objective
Delete all database data while preserving only the user `dennisceo@ryanmart.com` with their password.

## Steps

### Step 1: Ensure dennisceo user exists with correct password
- [ ] Run `backend/create_dennis_ceo.py`
- [ ] Verify user is created/updated correctly

### Step 2: Clear all data from database tables (except user table)
- [ ] Run `backend/clear_whole_db.py`
- [ ] Verify all non-user tables are empty

### Step 3: Delete all users except dennisceo@ryanmart.com
- [ ] Run custom script to delete other users
- [ ] Verify only dennisceo@ryanmart.com remains in user table

### Step 4: Verify the cleanup
- [ ] Check user count is 1
- [ ] Check dennisceo user has correct email, role, and password

### Step 5: Test backend functionality
- [ ] Test backend can start without errors
- [ ] Test login with dennisceo@ryanmart.com / Dennis4431!

