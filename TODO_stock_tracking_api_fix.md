# TODO: Fix Stock Tracking API Returning HTML Instead of JSON

## Problem
The stock tracking API endpoints `/api/stock-tracking` and `/api/stock-tracking/aggregated` are returning HTML (React 404 page) instead of JSON responses.

## Root Cause
The requests are hitting the React SPA catch-all route (`serve_react`) instead of the Flask-RESTful routes for stock tracking. This is likely due to:
1. Route registration order issues
2. Trailing slash mismatches
3. The `serve_react` function not properly catching API routes before Flask-RESTful

## Fix Applied

### 1. Backend Fix (`backend/app.py`)
- ✅ Improved the `serve_react` function to better distinguish API vs frontend routes
- ✅ Added logging for API routes intercepted by catch-all
- ✅ Added `path` field in JSON 404 response for debugging

### 2. Frontend Fix (`frontend/src/api/stockTracking.js`)
- ✅ Added API base URL detection (same logic as axios.js)
- ✅ Added the API base URL to error messages for debugging
- ✅ Improved error messages to include both endpoint and full URL

## Status: COMPLETED
After deploying:
1. Restart the backend server
2. Visit `/api/_debug/routes` to verify stock tracking routes are registered
3. Test the analytics dashboard to confirm stock tracking data loads

