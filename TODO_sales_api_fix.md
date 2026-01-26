# Sales API 404 Fix Progress

## Issues Identified
- SalesTab.jsx was using double `/api` in URL: `${BASE_URL}/api/sales` where BASE_URL already included `/api`
- api.js baseURL was defaulting to `/api` instead of full backend URL in production

## Changes Made
- [x] Fixed api.js baseURL to use full backend URL with `/api` for production
- [x] Fixed SalesTab.jsx fetch URL to remove extra `/api`

## Testing Needed
- [ ] Test sales data loading in SalesTab
- [ ] Test account tab sales data loading
- [ ] Test PDF download functionality
- [ ] Verify no more 404 errors for sales endpoints

## Files Modified
- frontend/src/api/api.js
- frontend/src/components/SalesTab.jsx
