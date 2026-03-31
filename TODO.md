# Fix 500 Errors: Purchases & Car Expenses APIs (Spolige Column Issue)

## STATUS: [IN PROGRESS] ⏳

### 1. [✅] Create TODO.md with plan breakdown
### 2. [PENDING] 📝 Edit backend/resources/purchases.py
   - Remove `, spolige` from 4 raw SQL SELECT queries  
   - Remove spolige row access in dicts (row[11])
### 3. [PENDING] 📝 Edit backend/resources/expenses.py  
   - Remove `, spolige` from CarExpensesResource.get SQL
   - Remove `spolige: row[10]` from expense_dict
### 4. [PENDING] 🧪 Test APIs locally
   ```bash
   curl http://localhost:5000/api/purchases  
   curl http://localhost:5000/api/car-expenses
   ```
### 5. [PENDING] 🚀 Deploy & Verify Render
   - git add/commit/push
   - Check Render logs (no 500s)
   - Test frontend tabs
### 6. [LATER] 🔄 Optional: Alembic migration for spolige columns
   - alembic revision --autogenerate -m "add_spolige_columns" 
   - Deploy migration

**Completed: 1/6** | **Next: Edit purchases.py**

