# Fix Application Errors

## Root Causes Identified
1. Backend routing issue: catch-all route intercepts API calls and returns HTML
2. Timeout mismatch: frontend auth 30s vs API service 10s
3. Error handling: backend sometimes returns HTML instead of JSON

## Tasks
- [ ] Fix catch-all route in backend/app.py to not intercept /api/* routes
- [ ] Increase API timeout to 60s in frontend services
- [ ] Ensure all backend errors return JSON
- [ ] Test auth endpoint response
- [ ] Test sales endpoint response
