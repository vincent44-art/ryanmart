# CEO Dashboard 404 Fix

## Task
Fix the 404 error when accessing CEO dashboard at `ryanmart-bacckend.onrender.com/ceo/dashboard`

## Error (Original)
```
ryanmart-bacckend.onrender.com/ceo/dashboard?_t=1769467198661:1 Failed to load resource: the server responded with a status of 404 ()
dashboard.js:105 Dashboard API Error: Object
```

## Root Cause
- Frontend calls API endpoints without the `/api` prefix
- Backend routes are registered with the `/api` prefix
- This mismatch causes the 404 errors

## Fixes Applied
1. Updated `frontend/src/api/dashboard.js` to add `/api` prefix to all dashboard endpoints:
   - `/ceo/dashboard` → `/api/ceo/dashboard`
   - `/seller/dashboard` → `/api/seller/dashboard`
   - `/purchaser/dashboard` → `/api/purchaser/dashboard`
   - `/storekeeper/dashboard` → `/api/storekeeper/dashboard`

2. Updated `frontend/src/components/apiHelpers.js` to add `/api` prefix to all endpoints:
   - `/inventory` → `/api/inventory`
   - `/stock-movements` → `/api/stock-movements`
   - `/purchases` → `/api/purchases`
   - `/other_expenses` → `/api/other_expenses`
   - `/users` → `/api/users`
   - `/sales` → `/api/sales`
   - `/assignments` → `/api/assignments`
   - `/car-expenses` → `/api/car-expenses`
   - `/clear-all` → `/api/clear-all`
   - `/salaries` → `/api/salaries`

## Changes Made
- ✅ Fixed API endpoint paths in `frontend/src/api/dashboard.js`
- ✅ Fixed API endpoint paths in `frontend/src/components/apiHelpers.js`

## Note on 500 Errors
The 404 errors are now fixed. If you're seeing 500 Internal Server Errors, these are backend issues. The frontend endpoints now correctly match the backend routes:
- `/api/inventory` - InventoryListResource
- `/api/purchases` - via purchases_bp blueprint
- `/api/stock-movements` - StockMovementListResource (may need to be registered in app.py)
- `/api/stock-tracking` - StockTrackingListResource

Backend troubleshooting may be needed for the 500 errors.
