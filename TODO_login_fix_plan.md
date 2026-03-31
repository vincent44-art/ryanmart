# Login Error Fix Plan

## Error Analysis
```
api.js:93 [API] Response error: dn
AuthContext.jsx:70 Login error: dn
Login.jsx:26 Login failed: Login failed
```

The error "dn" appears truncated. This could be:
- Network error (DNS resolution failure)
- CORS preflight failure
- Server returning HTML instead of JSON
- Truncated error message from axios

## Files to Fix

### 1. Fix AuthContext.jsx Import Path
**Issue**: `import api from '../services/api'` should be `import api from '../api/api'`

### 2. Improve Error Handling in api.js
**Issue**: Error messages are truncated. Need better logging.

### 3. Add Debug Endpoint for Login
**Issue**: Need better visibility into login failures

### 4. Add CORS Headers to Login Response
**Issue**: Ensure CORS headers are present on login responses

### 5. Fix User Role Serialization in Login
**Issue**: Role enum serialization might cause issues

## Changes Required

### File: frontend/src/contexts/AuthContext.jsx
```javascript
// Change from:
import api from '../services/api';
// To:
import api from '../api/api';
```

### File: frontend/src/api/api.js
- Add better error logging
- Add more detailed error messages
- Handle network errors more gracefully

### File: backend/resources/auth.py
- Add CORS headers to login response
- Add better error logging

### File: backend/utils/helpers.py  
- Ensure make_response_data always returns proper CORS headers

## Test After Fix

1. Check browser Network tab for OPTIONS request status
2. Check if login returns proper JSON with access_token
3. Verify error messages are not truncated

## Progress
- [ ] Fix AuthContext import path
- [ ] Improve API error logging
- [ ] Add CORS headers to login response
- [ ] Test login functionality

