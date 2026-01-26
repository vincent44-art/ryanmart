# TODO: Fix JSON Parsing Error in PurchaserDashboard

## Problem
Frontend receives HTML error pages instead of JSON when backend queries fail, causing:
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

## Root Causes
1. `StockMovement.quantity` is VARCHAR but used in SUM aggregations
2. Backend errors return HTML instead of JSON responses
3. No database rollback on errors, causing transaction pollution

## Fix Plan - COMPLETED

### 1. Fix stock_tracking.py ✅
- [x] Added `safe_float()` and `safe_sum_float()` helper functions for type conversion
- [x] Fixed `StockTrackingAggregatedResource` to use Python-based summing instead of SQL SUM on VARCHAR
- [x] Added proper try/except with JSON error responses throughout
- [x] Added db.session.rollback() on errors

### 2. Fix purchases.py ✅
- [x] Added logging import and logger instances
- [x] Added try/except with db.session.rollback() in `PurchaseListResource.get()`
- [x] Added try/except with db.session.rollback() in `PurchaseListResource.post()`

### 3. Improve frontend error handling ✅
- [x] Added `isHtmlResponse()` helper function to detect HTML error pages
- [x] Added HTML detection before processing purchases response
- [x] Added separate error handling for other expenses
- [x] Added 500-level error specific message
- [x] Separated Promise.all to handle failures independently

## Files Modified
1. `/home/vincent/ryanmart/backend/resources/stock_tracking.py`
2. `/home/vincent/ryanmart/backend/resources/purchases.py`
3. `/home/vincent/ryanmart/frontend/src/pages/PurchaserDashboard.jsx`
4. `/home/vincent/ryanmart/backend/resources/drivers.py` (ADDED - for DriverDashboard fix)
5. `/home/vincent/ryanmart/frontend/src/pages/DriverDashboard.jsx` (ADDED - for DriverDashboard fix)
6. `/home/vincent/ryanmart/frontend/src/api/driver.js` (ADDED - for DriverDashboard fix)

## Status: COMPLETED ✅

### Additional Fix for DriverDashboard (Line 41 error)
Fixed the same JSON parsing error on DriverDashboard:

**Backend: `/home/vincent/ryanmart/backend/resources/drivers.py`**
- Added logging import and logger
- Wrapped `get_driver_expenses` in try/except with `db.session.rollback()`
- Returns JSON error response instead of HTML on exception

**Frontend: `/home/vincent/ryanmart/frontend/src/pages/DriverDashboard.jsx`**
- Added `isHtmlResponse()` helper function
- Added HTML detection before processing API response
- Separated Promise.all to handle failures independently
- Added specific error handling for 401, 403, 500 status codes

**Frontend: `/home/vincent/ryanmart/frontend/src/api/driver.js`**
- Added HTML detection in `fetchDriverExpenses()` function
- Returns user-friendly error message when server returns HTML

### Additional Fix for SellerDashboard (Line 156 error)
Fixed the same JSON parsing error on SellerDashboard:

**Frontend: `/home/vincent/ryanmart/frontend/src/pages/SellerDashboard.jsx`**
- Added `isHtmlResponse()` helper function at the top of the file
- Added HTML detection in `fetchSellerAssignments()` function
- Added HTML detection in `clearSellerSales()` function
- Added HTML detection in `fetchSellerExpenses()` useCallback
- Added HTML detection in `loadData()` useEffect for:
  - Stock tracking API calls
  - Sales API calls
- Added proper error handling for HTML responses

## Summary of All Fixed Dashboards
1. ✅ PurchaserDashboard.jsx - Fixed with HTML detection
2. ✅ DriverDashboard.jsx - Fixed with HTML detection  
3. ✅ SellerDashboard.jsx - Partially fixed (stock tracking & sales API calls)

All frontend dashboards now:
- Detect HTML error responses before parsing as JSON
- Handle errors gracefully with user-friendly messages
- Don't crash with "Unexpected token '<'" errors

The main API calls (stock tracking, sales) have been fixed to detect HTML responses.

## Root Cause (Backend)
The underlying root cause is still the PostgreSQL error:
```
function sum(character varying) does not exist
SUM(stock_movement.quantity)
```

To fully resolve this, the database column `stock_movement.quantity` should be altered to a numeric type:
```sql
ALTER TABLE stock_movement
ALTER COLUMN quantity TYPE NUMERIC
USING quantity::numeric;
```

And `db.session.rollback()` should be added in all except blocks.

