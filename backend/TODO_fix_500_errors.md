# TODO: Fix 500 Errors on /api/purchases and /api/car-expenses
Status: [IN PROGRESS] ✅ PLAN APPROVED

## Steps from Approved Plan:

### 1. ✅ Add try-catch and safe serialization to `backend/resources/expenses.py` (CarExpensesResource.get())
### 2. ✅ Verify/implement `DriverExpense.to_dict()` in `backend/models/driver.py` (exists, safe)
### 3. ✅ Minor logging enhancement to `backend/resources/purchases.py` (defensive)
### 4. [ ] Test endpoints: `curl -H "Authorization: Bearer <token>" https://ryanmart-bacckend.onrender.com/api/car-expenses`
### 5. [ ] Test `/api/purchases`
### 6. [ ] Backend redeploy to Render
### 7. [ ] Frontend test: PurchasesTab.jsx and CarExpensesTab.jsx
### 8. [ ] [COMPLETED] Close issue

**Progress**: Core fixes applied! Ready for testing & deploy.

**Notes**:
- Focus primary fix: CarExpensesResource (no try-catch)
- Secondary: Ensure model serialization safe
- DB: PostgreSQL likely (Render), raw SQL already safe in purchases.py

