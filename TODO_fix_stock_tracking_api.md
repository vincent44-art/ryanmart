# TODO: Fix Stock Tracking API returning HTML instead of JSON

## Problem
The stock tracking API endpoints `/api/stock-tracking` and `/api/stock-tracking/aggregated` are returning HTML (404 page) instead of JSON responses.

## Root Cause
The requests are hitting the React SPA catch-all route (`serve_react`) instead of the Flask-RESTful routes for stock tracking. This could be due to:
1. Route registration order issues
2. Trailing slash mismatches
3. CORS preflight issues

## Fix Applied

### 1. Backend Fix (`backend/app.py`)
Added direct Flask route handlers as fallbacks that bypass Flask-RESTful:
- `/api/stock-tracking` - GET and POST handlers with JWT authentication
- `/api/stock-tracking/aggregated` - GET handler with JWT authentication

These handlers:
- Include proper CORS headers including preflight OPTIONS handling
- Verify JWT authentication and user permissions
- Handle all the same operations as the Flask-RESTful resources
- Return proper JSON responses
- Include comprehensive error handling and logging

### 2. Frontend Fix (`frontend/src/api/stockTracking.js`)
Added improved error handling:
- New `isHtmlResponse()` helper function to detect HTML error pages
- Better error messages that include the URL being called
- Improved console logging for debugging
- More context in thrown errors

## Files Modified
1. `backend/app.py` - Added fallback Flask route handlers
2. `frontend/src/api/stockTracking.js` - Improved error handling and diagnostics

## Testing
After deploying these changes:
1. Visit `/api/health` to verify the backend is running
2. Visit `/api/_debug/routes` to see all registered routes
3. Visit `/api/_debug/stock-tracking` to test the stock tracking endpoint directly
4. Try logging in and accessing the analytics dashboard

## Status: COMPLETED

