# Backend Errors Fix Plan

## Issues Identified:
1. **Timeout on GET /api/auth/me** - Backend hanging, possibly DB connection issue
2. **500 error on GET /api/sales/email/kimani@seller.com** - Returns HTML instead of JSON due to server crash

## Root Causes:
1. Migration `b2c3d4e5f6g7` uses PostgreSQL syntax `NOW()` for SQLite
2. Missing error handling in API endpoints
3. Potential DB connection pooling issues

## Fix Steps - COMPLETED:
1. [x] Fix migration file to use SQLite-compatible syntax (`datetime('now')` instead of `NOW()`)
2. [x] Add defensive check for `sale.date` field in SaleByEmailResource
3. [x] Add timeout configuration for database connections with improved pool settings
4. [ ] Test the fixes

## Files Modified:
- `backend/migrations/versions/b2c3d4e5f6g7_add_created_at_to_sale.py`
- `backend/resources/sales.py`
- `backend/config.py`

## Additional Notes:
- Database pool size increased to 5 with max overflow of 10
- Statement timeout set to 30 seconds to match frontend timeout
- Session options configured for better timeout handling

