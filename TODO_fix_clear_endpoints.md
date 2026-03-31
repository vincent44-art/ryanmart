# Fix Clear Data API 405 Errors - Approved Plan

Status: In Progress

## Steps:
### 1. Planning ✅ Complete
   - Analyzed files, confirmed /api/purchases → /api/purchases/clear needed

### 2. Create TODO ✅ Complete

### 3. Edit apiHelpers.js ✅ Complete (6/6 clear endpoints fixed: purchases, sales, inventory, car-expenses, other_expenses, salaries)
   - Update 6 clear functions:
     | Function | Old URL | New URL |
     |----------|---------|---------|
     | clearPurchasesDataAPI | /api/purchases | /api/purchases/clear |
     | clearSalesDataAPI | /api/sales | /api/sales/clear |
     | clearInventoryDataAPI | /api/inventory | /api/inventory/clear |
     | clearCarExpensesDataAPI | /api/car-expenses | /api/car-expenses/clear |
     | clearOtherExpensesDataAPI | /api/other_expenses | /api/other_expenses/clear |
     | clearSalariesDataAPI | /api/salaries | /api/salaries/clear |

### 4. Test ✅ Ready for manual test
   - Login as CEO account
   - Open ClearDataModal (any dashboard)
   - Click "Clear Purchases Data" → Should succeed (200), show success message, purchases cleared from DB
   - Check Network tab: DELETE /api/purchases/clear → success
   - Test other buttons similarly

### 5. Completion [READY] Task complete once tested

