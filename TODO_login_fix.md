# Login 404 Fix Plan

## Problem
- Frontend Static Site on Render returns 404 for `/login` route
- SPA routing doesn't work because Render Static Sites don't process `_redirects`

## Solution
Serve React frontend through Flask backend (same origin)

## Changes Required

### 1. Frontend API Configuration
**File:** `frontend/src/services/api.js`
- Change API URL to use relative path (`/api`) since same origin

### 2. Backend Configuration  
**File:** `backend/app.py`
- Already has SPA routing code at the end
- Ensure correct path to frontend build folder

### 3. Build & Deploy Steps
- Rebuild frontend with updated API config
- Deploy only backend to Render
- Remove separate frontend Static Site

## Execution Order
1. [x] Update `frontend/src/services/api.js` - Use relative API path
2. [ ] Rebuild frontend: `cd frontend && npm run build`
3. [ ] Test locally
4. [ ] Deploy backend to Render (keep existing config)
5. [ ] Delete frontend Static Site from Render

