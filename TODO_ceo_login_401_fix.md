# CEO Login 401 Fix Plan
## Status: In Progress

1. ✅ Verified CEO user: dennisceo@ryanmart.com exists, Role.CEO, active, password MATCHES 'Dennis4431!', is_first_login=False
2. [ ] Test login API: curl POST /api/auth/login
3. [ ] ...
2. [ ] Test login API: curl POST /api/auth/login with CEO creds
3. [ ] If no user: Run backend/create_dennis_ceo.py
4. [ ] If password bad: Run backend/scripts/reset_ceo_password.py
5. [ ] Test dashboard /api/ceo/dashboard with token
6. [ ] Frontend test: Login CEO -> Dashboard
7. [ ] Close: attempt_completion

Known CEO: dennisceo@ryanmart.com / Dennis4431!
Alt: ceo@fruittrack.com / password123
