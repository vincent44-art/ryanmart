# API Fix - Stock Tracking Aggregated Data

## Error
```
Aggregated data API error: Server returned HTML page instead of JSON. 
The API endpoint "/api/stock-tracking/aggregated" may not be registered or backend is not running. 
URL: https://ryanmart-bacckend.onrender.com/api/stock-tracking/aggregated
```

## Root Causes
1. **URL Typo in CORS Config**: `ryanmart-fronntend.onrender.com` should be `ryanmart-frontend.onrender.com`
2. **Frontend API Uses Relative Paths**: `stockTracking.js` uses relative paths instead of full API URLs

## Fix Steps
- [ ] 1. Fix CORS typo in backend/config.py
- [ ] 2. Fix API URL in frontend/src/api/stockTracking.js
- [ ] 3. Test locally
- [ ] 4. Deploy and verify

