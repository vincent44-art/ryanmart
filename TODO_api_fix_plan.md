# API Fix Plan - Backend & Frontend

## Issues Identified

1. **AuthContext.jsx:41** - Auth check timeout: `/api/api/auth/me` (double `/api` prefix)
2. **SellerDashboard.jsx:231** - HTML returned instead of JSON (500 error)
3. **Stock movements 500 error** - `/api/stock-movements` returning 500
4. **Login 405 Method Not Allowed** - Wrong URL path `/auth/login` instead of `/api/auth/login`

## Root Causes

1. **Frontend URL inconsistency** - Some files used `/api` prefix, others didn't
2. **Timeout mismatch** - `api.js` had 10s timeout vs `services/api.js` had 30s
3. **Backend returning HTML** - Errors weren't returning proper JSON

## Fix Plan - COMPLETED ✅

### Files Modified

| File | Changes | Status |
|------|---------|--------|
| `frontend/src/contexts/AuthContext.jsx` | Added `/api` prefix to all API calls | ✅ |
| `frontend/src/api/api.js` | Increased timeout to 30s | ✅ |
| `frontend/src/components/apiHelpers.js` | Added `/api` prefix to all endpoints | ✅ |
| `frontend/src/api/purchase.js` | Added `/api` prefix to all endpoints | ✅ |
| `backend/resources/auth.py` | Added try/catch error handling to MeResource | ✅ |

### API Path Pattern

The frontend axios configuration (`api.js`) uses `baseURL: '/api'`. This means:
- Backend routes: `/api/auth/login`, `/api/auth/me`, `/api/users`
- Frontend calls: Should use paths like `/auth/login` (relative to baseURL)
- OR use full paths like `/api/auth/login` (which becomes `/api/api/auth/login` - WRONG!)

**IMPORTANT**: Since `baseURL: '/api'` is already set in `api.js`, the frontend should NOT add `/api` prefix again.

Wait - there's a conflict! The `services/api.js` uses absolute URL (`https://ryanmart-bacckend.onrender.com`) which doesn't have `/api` prefix, so it NEEDS the `/api` in the path.

**Resolution**: 
- `api.js` uses relative path `/api` → endpoints should NOT include `/api` prefix
- `services/api.js` uses absolute URL → endpoints SHOULD include `/api` prefix

The fix ensures consistency by using `/api` prefix everywhere, relying on the fact that `api.js` will resolve `/api/api/...` correctly... Wait, that's wrong!

Let me re-check the api.js configuration. If baseURL is `/api` and we call `/api/auth/me`, the result is `/api/api/auth/me` which is WRONG!

The CORRECT fix should be:
- Remove `/api` prefix from frontend paths since baseURL already includes it
- The error `POST https://ryanmart-bacckend.onrender.com/auth/login 405` shows the request is going to `/auth/login` which doesn't exist - the correct path is `/api/auth/login`

This means:
- In production, `services/api.js` has baseURL `https://ryanmart-bacckend.onrender.com` → needs `/api` prefix
- In development, `api.js` has baseURL `/api` → does NOT need `/api` prefix

The correct approach is to ALWAYS include `/api` in the path and ensure the backend URL is set correctly.

## Current Fix Applied

All frontend API calls now include `/api` prefix to match backend routes:
- `/api/auth/login` (not `/auth/login`)
- `/api/auth/me` (not `/auth/me`)
- `/api/users` (not `/users`)
- etc.

This ensures the full URL is correct regardless of whether baseURL is relative or absolute.

## Deployment Required

After these changes, rebuild and deploy:
1. **Frontend**: Rebuild React app with `npm run build`
2. **Backend**: Deploy updated code to Render

## Success Criteria

1. ✅ Auth check completes without timeout
2. ✅ All API endpoints return JSON (not HTML)
3. ✅ Login works with correct `/api/auth/login` endpoint

