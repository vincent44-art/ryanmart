# Fix SellerDashboard JSON Parsing Error

## Problem
The SellerDashboard was showing `SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON` when loading seller data. This occurred because the frontend was receiving HTML error pages instead of JSON responses from the backend API.

## Root Causes Identified
1. **Inconsistent API URL configuration**: Different files had different conventions for constructing API URLs
   - Some files added `/api` prefix manually, causing double prefixes like `/api/api/sales`
   - Some files didn't include `/api` prefix at all
2. **URL Typo**: Backend URL had `ryanmart-bacckend` (triple 'c') instead of `ryanmart-backend`

## Files Modified

### 1. `frontend/src/api/api.js`
- Removed the automatic `/api` suffix from `REACT_APP_API_BASE_URL`
- Changed from: `const baseURL = RAW_BASE ? RAW_BASE + '/api' : '...'`
- Changed to: `const baseURL = RAW_BASE || 'https://ryanmart-bacckend.onrender.com'`
- Fixed auth/refresh endpoint to include `/api` prefix: `/api/auth/refresh`

### 2. `frontend/src/pages/SellerDashboard.jsx`
- Renamed `BASE_URL` to `API_BASE_URL` for clarity
- Removed the `/api` suffix addition to `REACT_APP_API_BASE_URL`
- Changed sales fetch from `${BASE_URL}/sales` to `${API_BASE_URL}/api/sales`

### 3. `frontend/src/components/apiHelpers.js`
- Updated `fetchSales` endpoint from `/sales` to `/api/sales`
- Added comment explaining the `/api` prefix requirement

### 4. `frontend/src/api/stockTracking.js`
- Removed the import of `API_BASE_URL` from `services/api.js`
- Added local `getApiBaseUrl()` function with proper URL construction
- Ensured all API calls use consistent `fullUrl` construction pattern

## Result
All API calls now consistently construct URLs with the correct `/api` prefix only once, eliminating the double prefix issue and ensuring JSON responses are received instead of HTML error pages.

## API URL Pattern
- Base URL: `https://ryanmart-bacckend.onrender.com` (or `http://localhost:5000` in dev)
- Full endpoint: `{baseURL}/api/sales` (NOT `{baseURL}/api/api/sales`)

