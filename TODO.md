# API 500 Error Fix Plan - Purchases & Other Expenses
Tracking progress on fixing 500 errors in purchases API and empty other expenses data.

## Steps to Complete:

### 1. [ ] Create this TODO.md (IN PROGRESS)
### 2. [✅] Fix backend/resources/purchases.py
   - Parameterize all raw SQL queries
   - Fix logger import issues
   - Sanitize LIMIT/OFFSET inputs
   - Improve error handling
   
### 3. [✅] Fix backend/resources/other_expenses.py  
   - Parameterize SQL queries for empty data issue
   - Ensure proper JSON response structure
   
### 4. [ ] Remove duplicate backend/resources/purchases_fixed.py

### 5. [ ] Test backend with test_purchase_api.py
   ```bash
   python test_purchase_api.py
   ```
   Expected: All endpoints return JSON (even 401s)

### 6. [ ] Restart backend server

### 7. [ ] Test frontend PurchaserDashboard
   - Login as purchaser
   - Verify purchases load without 500
   - Test add purchase form
   
### 8. [ ] [ ] Update progress in this file

## Current Status
- Plan approved ✅
- Files analyzed ✅

