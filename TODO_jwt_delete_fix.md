# Fix 401 Unauthorized on DELETE for Sales and Purchases

## Steps
- [ ] Step 1: Add @jwt_required() to all @role_required methods in backend/resources/sales.py
- [ ] Step 2: Add @jwt_required() to all @role_required methods in backend/resources/purchases.py
- [ ] Step 3: Verify syntax of edited files

