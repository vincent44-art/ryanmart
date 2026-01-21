# Purchase API Fix

## Issue
The purchase dashboard was showing "Failed to load data. The server may be returning an error page. Please check your connection and try again." This was caused by the API returning HTML instead of JSON, leading to JSON parsing errors.

## Root Cause
The `/api/purchases/by-email/<email>` endpoint was defined as a blueprint route instead of a Flask-RESTful Resource. This caused routing conflicts with the catch-all route in app.py that serves the React frontend, resulting in HTML being returned instead of JSON.

## Solution
1. Converted the blueprint route to a Flask-RESTful Resource class `PurchaseByEmailResource`
2. Removed the old blueprint route
3. Added the new resource to the imports in `backend/resources/__init__.py`
4. Registered the new resource in the API routes

## Files Modified
- `backend/resources/purchases.py`: Added `PurchaseByEmailResource` class and removed old blueprint route
- `backend/resources/__init__.py`: Added import and registration for `PurchaseByEmailResource`

## Status
✅ Fixed - The API now properly returns JSON responses for purchase data by email.
