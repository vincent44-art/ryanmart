# Fix JSON Parsing Error in SellerDashboard.jsx

## Issue
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
- Frontend expects JSON but backend returns HTML (error page, 404, etc.)
- Happens when fetch calls try to parse HTML as JSON

## Root Cause
Some fetch calls in SellerDashboard.jsx lack HTML response checks before calling response.json()

## Plan
- [x] Add safe JSON parsing to all fetch calls in SellerDashboard.jsx
- [x] Use existing safeJsonParse function or add HTML checks
- [x] Ensure consistent error handling across all API calls

## Files to Edit
- frontend/src/pages/SellerDashboard.jsx

## Steps
1. [x] Identify all fetch calls in SellerDashboard.jsx
2. [x] Add HTML response checks before JSON parsing
3. [x] Test the changes

## Additional Issues Found and Fixed
- [x] Fixed assignments endpoint registration issue in backend/resources/assignments.py
  - Removed conflicting url_prefix from blueprint since it's registered with proper prefix in app.py
  - This was causing the endpoint to return HTML instead of JSON

## Testing Status
- [x] Frontend compilation errors fixed
- [x] Backend endpoint registration corrected
- [x] HTML response detection working properly (error messages now correctly identify when server returns HTML)
- [x] JSON parsing errors prevented by safe parsing implementation
