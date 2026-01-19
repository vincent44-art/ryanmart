# TODO Fix Stock Tracking API - JSON/HTML Error

## Problem
The frontend (`/api/stock-tracking`) was receiving HTML (React's `index.html`) instead of JSON from the API.

## Root Causes Identified

1. **Duplicate Route Registration**: Stock tracking routes were registered in both:
   - `backend/resources/__init__.py`
   - `backend/app.py`
   
2. **Missing JWT Error Handlers**: Flask-JWT-Extended was not properly handling missing authorization headers, causing 500 errors instead of 401.

## Fixes Applied

### 1. Removed Duplicate Routes from `resources/__init__.py`
- Removed stock tracking route imports and registrations
- Fixed SaleResource route from `/api/sales/<int:sale_id>` to `/sales/<int:sale_id>` (avoiding double `/api/` prefix)

### 2. Added Debug Endpoints in `app.py`
- `/api/_debug/routes` - Lists all registered API routes
- `/api/_debug/stock-tracking` - Direct test endpoint for stock tracking

### 3. Added JWT Error Handlers in `app.py`
- `missing_token_callback` - Handles missing authorization (was already present)
- `needs_fresh_token_callback` - Handles fresh token requirement
- `revoked_token_callback` - Handles revoked tokens

## Verification

Run the test script to verify:
```bash
cd /home/vincent/ryanmart && python test_stock_tracking_api.py
```

Expected results:
- `/api/health` ✅ Returns JSON
- `/api/_debug/routes` ✅ Returns JSON with stock tracking routes
- `/api/_debug/stock-tracking` ✅ Returns JSON
- `/api/stock-tracking` ✅ Returns JSON (401 for unauthorized)

## Debug Endpoints

Use these to diagnose issues:
1. **Check route registration**: `GET /api/_debug/routes`
2. **Test stock tracking**: `GET /api/_debug/stock-tracking`
3. **Health check**: `GET /api/health`
4. **CORS test**: `GET /api/cors-test`

## If Still Getting HTML

If the frontend still receives HTML:
1. Ensure frontend is using correct API URL: `/api/stock-tracking`
2. Check browser DevTools Network tab for actual response
3. Verify CORS headers are present in response
4. Check that the backend is running and accessible

