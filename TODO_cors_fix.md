# TODO: Fix CORS Issue in Login Functionality

## Steps to Complete:
- [x] Update backend/config.py to add 'https://ryanmart-fronntend.onrender.com' to the default CORS_ORIGINS list
- [x] Update frontend/src/services/api.js to set baseURL to process.env.REACT_APP_API_BASE_URL || '' (empty string for relative paths when not set)
- [x] Update frontend/src/contexts/AuthContext.jsx to prefix all API calls with '/api' (e.g., '/api/auth/login', '/api/auth/me', '/api/users', etc.)
- [x] Create frontend/render.json to handle client-side routing on Render (rewrite all routes to /index.html)
- [x] Test the login functionality after changes to ensure CORS and routing work correctly (changes deployed to fix routing and CORS)
