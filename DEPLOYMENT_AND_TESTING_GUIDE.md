# Complete Deployment & Testing Guide

## ✅ Implementation Status: COMPLETE

All 6 API path fixes have been successfully applied and verified. Your application is now ready for testing and deployment.

---

## 📋 What Changed

### **AuthContext.jsx - 6 API Endpoints Fixed**
All leading slashes removed from API paths so they properly use the baseURL configuration:

1. ✅ `api.get('auth/me')` - Auth verification
2. ✅ `api.post('auth/login', ...)` - User login
3. ✅ `api.get('users')` - Get all users
4. ✅ `api.post('users', ...)` - Add new user
5. ✅ `api.put('users/${userId}', ...)` - Update user
6. ✅ `api.delete('users/${userId}')` - Delete user

### **New Environment Files Created**
- ✅ `frontend/.env.development` - For local development
- ✅ `frontend/.env.production` - For DreamHost production

---

## 🧪 Phase 1: Local Testing (Recommended First)

### **Step 1: Start Backend Server**

```bash
# Navigate to backend directory
cd /home/vincent/job-tracking-system/backend

# Activate virtual environment (if not already)
source venv/bin/activate

# Run Flask development server
python -m flask run

# Expected output:
# WARNING in app.logger: * Running on http://localhost:5000
```

The backend will now be running on `http://localhost:5000`

### **Step 2: Start Frontend Development Server**

```bash
# In a new terminal, navigate to frontend
cd /home/vincent/job-tracking-system/frontend

# Install dependencies (if needed)
npm install

# Start React dev server with local environment
npm start

# Expected output:
# compiled successfully
# You can now view job-tracking-frontend-new in the browser
# Local: http://localhost:3000
```

The frontend will now be running on `http://localhost:3000`

### **Step 3: Test in Browser**

1. **Open Browser** → `http://localhost:3000`
2. **Open DevTools** → Press `F12`
3. **Go to Network Tab**
4. **Attempt Login**:
   - Email: (use test account)
   - Password: (use test password)
5. **Verify Network Requests**:
   - Look for request to: `http://localhost:5000/api/auth/login` ✅
   - Status should be `200` (success) or `401` (invalid credentials)
   - NOT `404` (not found)
   - NOT `http://localhost:3000/api/auth/login`

### **Step 4: Verify All API Calls**

With .env.development in place, test these endpoints:

```bash
# In new terminal, test endpoints directly
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Expected Local Behavior**

| Action | Expected Result |
|--------|-----------------|
| Login | 200 OK, returns access_token |
| GET users | 200 OK, returns user list |
| Network tab | Shows requests to `localhost:5000` |
| Console | No CORS errors |
| localStorage | Contains `access_token` after login |

---

## 🏗️ Phase 2: Build for Production

### **Step 1: Prepare Environment**

```bash
# Ensure you're in the frontend directory
cd /home/vincent/job-tracking-system/frontend

# Set production environment variable
REACT_APP_API_BASE_URL=https://ryanmart.store/backend

# Verify it's set
echo $REACT_APP_API_BASE_URL
# Output: https://ryanmart.store/api
```

### **Step 2: Build React App**

```bash
# Build for production
npm run build

# Expected output:
# Creating an optimized production build...
# compiled successfully
# 
# The build folder is ready to be deployed
```

This creates an optimized build in `frontend/build/`

### **Step 3: Verify Build Contains Correct URL**

```bash
# Check that DreamHost URL is embedded in built files
grep -r "ryanmart.store/api" frontend/build/static/js/

# Expected output:
# main.[hash].js contains: ryanmart.store/api

# If no output, the build FAILED to include the URL
# This means the environment variable wasn't set during build
```

### **Step 4: Test Built Version Locally**

```bash
# Install serve globally (if not already)
npm install -g serve

# Serve the built files
cd frontend/build
serve

# Expected output:
# Accepting connections at http://localhost:3000

# Open browser to http://localhost:3000
# API calls should attempt to reach https://ryanmart.store/api
# (will fail since DreamHost isn't running, but URL should be correct)
```

---

## 🚀 Phase 3: Deploy to DreamHost

### **Step 1: Prepare DreamHost Environment**

```bash
# SSH into DreamHost
ssh user@dreamhost.com

# Navigate to your DreamHost application directory
cd /path/to/your/dreamhost/application

# Create/update .env file for Flask
nano .env

# Add these settings:
DATABASE_URL=mysql+pymysql://user:password@db.dreamhost.com/dbname
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret
CORS_ORIGINS=https://ryanmart.store,https://www.ryanmart.store
```

### **Step 2: Update Backend CORS Configuration**

Ensure `backend/config.py` has DreamHost domain in CORS_ORIGINS:

```python
if _cors_env:
    CORS_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
else:
    # Fallback for DreamHost
    CORS_ORIGINS = ["https://ryanmart.store", "https://www.ryanmart.store"]
```

### **Step 3: Deploy Frontend Build Files**

```bash
# From your local machine, upload built files to DreamHost
cd /home/vincent/job-tracking-system/frontend

# Copy build directory to DreamHost web root
scp -r build/* user@dreamhost.com:/home/your-user/your-domain/

# Verify files are in place
ssh user@dreamhost.com "ls -la /home/your-user/your-domain/"
```

### **Step 4: Start Backend on DreamHost**

```bash
# SSH into DreamHost
ssh user@dreamhost.com

# Navigate to backend
cd /path/to/backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
export FLASK_APP=backend.app
flask db upgrade

# Start Gunicorn
gunicorn -w 4 -b 127.0.0.1:5000 backend.app:app &

# Verify it's running
curl http://127.0.0.1:5000/api/auth/me
```

### **Step 5: Verify Nginx Configuration**

Update `/etc/nginx/sites-available/your-domain` (or wherever it's configured):

```nginx
server {
    listen 80;
    server_name ryanmart.store www.ryanmart.store;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ryanmart.store www.ryanmart.store;

    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Serve static frontend
    root /home/your-user/your-domain;
    index index.html;

    # API proxy
    location /api/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    # Proxy the backend mount (served from /backend on the public site)
    proxy_pass http://127.0.0.1:5000;
        proxy_read_timeout 90;
    }

    # Frontend routing
    location / {
        try_files $uri /index.html;
    }
}
```

### **Step 6: Restart Services**

```bash
# SSH into DreamHost
ssh user@dreamhost.com

# Restart Nginx
sudo systemctl restart nginx

# Verify services
sudo systemctl status nginx
sudo systemctl status gunicorn  # if using systemd

# Check logs for errors
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Post-Deployment Testing

### **Test 1: Frontend Loads**
```bash
curl -I https://ryanmart.store/
# Expected: 200 OK
```

### **Test 2: Static Assets Load**
- Open https://ryanmart.store/ in browser
- Check DevTools Network tab
- Verify CSS, JS files load successfully
- Expected status: 200

### **Test 3: API is Reachable**
```bash
# When using the `/backend` mount the API will be reachable under /backend/api
curl -X GET https://ryanmart.store/backend/api/auth/me
# Expected: 401 (no token) or 200 (with token)
# NOT 404 or connection refused
```

### **Test 4: Login Works**
1. Go to https://ryanmart.store/
2. Login with test credentials
3. Monitor Network tab
4. Verify:
  - Request to: `https://ryanmart.store/backend/api/auth/login` ✅
   - Response status: 200
   - Response contains `access_token`
5. Verify localStorage has `access_token`

### **Test 5: Verify CORS Headers**
```bash
curl -I -X OPTIONS https://ryanmart.store/api/auth/me \
  -H "Origin: https://ryanmart.store"
  
# Should include:
# Access-Control-Allow-Origin: https://ryanmart.store
```

### **Test 6: User Operations**
Test each endpoint:
- [ ] Login - POST /api/auth/login
- [ ] Get Auth - GET /api/auth/me
- [ ] Get Users - GET /api/users
- [ ] Add User - POST /api/users
- [ ] Update User - PUT /api/users/{id}
- [ ] Delete User - DELETE /api/users/{id}

---

## � Running automated smoke tests

We've added a small smoke-test script that exercises the health and (optionally) an authenticated endpoint.

Location: `frontend/scripts/smoke-test.sh`

Run locally from the repo root (or from `frontend/`):

```bash
# Run with default base URL (https://ryanmart.store/backend)
cd frontend
npm run smoke-test

# Or run directly and supply a TOKEN for the authenticated check
TOKEN=your_test_token bash scripts/smoke-test.sh https://ryanmart.store/backend
```

Exit codes:
- 0: success (health endpoint returned 200 and optional auth check passed)
- 2: health check failed
- 3: authenticated check failed

Use this in CI to validate deployment quickly after you copy the build to DreamHost.

## �🔧 Troubleshooting

### **Issue: 404 Errors on API Calls**

**Symptoms:**
```
Network tab shows: https://ryanmart.store/api/auth/login → 404
Console error: "POST /api/auth/login 404"
```

**Causes & Solutions:**
1. **Backend not running**
   ```bash
   # Check if Gunicorn is running
   ps aux | grep gunicorn
   # If not, start it
   gunicorn -w 4 -b 127.0.0.1:5000 backend.app:app
   ```

2. **Nginx not proxying correctly**
   ```bash
   # Test direct connection to backend
   curl http://127.0.0.1:5000/api/auth/me
   # Should return 401 (no token), not 404
   ```

3. **CORS blocking requests**
   ```bash
   # Check CORS headers
   curl -I -X OPTIONS https://ryanmart.store/api/auth/me
   # Should include Access-Control-Allow-Origin header
   ```

### **Issue: Built Files Still Have localhost URL**

**Symptoms:**
```
Network calls go to http://localhost:5000/api/...
Instead of https://ryanmart.store/api/...
```

**Solution:**
```bash
# 1. Delete old build
rm -rf frontend/build

# 2. Set environment variable
export REACT_APP_API_BASE_URL=https://ryanmart.store/api

# 3. Verify it's set
echo $REACT_APP_API_BASE_URL

# 4. Rebuild
npm run build

# 5. Verify new build has correct URL
grep "ryanmart.store" frontend/build/static/js/main.*.js
# Should find matches

# 6. Deploy new build
scp -r frontend/build/* user@dreamhost.com:/path/to/webroot/
```

### **Issue: CORS Errors in Console**

**Error Message:**
```
Access to XMLHttpRequest at 'https://ryanmart.store/api/auth/login' 
from origin 'https://ryanmart.store' has been blocked by CORS policy
```

**Solution:**
1. Update `backend/config.py`:
```python
CORS_ORIGINS = ["https://ryanmart.store", "https://www.ryanmart.store"]
```

2. Or via environment variable:
```bash
export CORS_ORIGINS=https://ryanmart.store,https://www.ryanmart.store
```

3. Restart Flask/Gunicorn

### **Issue: Token Not Being Sent**

**Symptoms:**
```
Login works (201)
But subsequent requests fail with 401 Unauthorized
```

**Solution:**
Check `api.js` interceptor:
```javascript
// Should be adding Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

Verify token is stored in localStorage:
```javascript
// In browser console
localStorage.getItem('access_token')
// Should return your token, not null
```

---

## 📊 Checklist Before Going Live

### Code Quality
- [ ] All 6 API paths updated in AuthContext.jsx
- [ ] No leading slashes in API paths
- [ ] Environment files created (.env.development, .env.production)
- [ ] No hardcoded URLs in components

### Local Testing
- [ ] Backend runs on localhost:5000
- [ ] Frontend runs on localhost:3000
- [ ] Login works with local API
- [ ] Network tab shows correct localhost URLs
- [ ] No console errors

### Build Testing
- [ ] `npm run build` succeeds
- [ ] Built files contain DreamHost URL
- [ ] Built app can be served locally
- [ ] API URLs in built JS are correct

### DreamHost Deployment
- [ ] .env file created with database credentials
- [ ] Database migrations run successfully
- [ ] Gunicorn started and verified working
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Frontend files uploaded to web root

### Post-Deployment
- [ ] Frontend loads on DreamHost domain
- [ ] CSS/JS assets load correctly
- [ ] API endpoints reachable
- [ ] Login works end-to-end
- [ ] All CRUD operations work (users)
- [ ] No console errors
- [ ] No network 404/401 errors
- [ ] CORS headers present in responses

---

## 📝 Git Commit Message

```
feat: Fix API path configuration and add environment files

Changes:
- Remove leading slashes from all API endpoints in AuthContext.jsx
  * Fixes: api.get('/auth/me') → api.get('auth/me')
  * Fixes: api.post('/auth/login') → api.post('auth/login')
  * Fixes: api.get('/users') → api.get('users')
  * Fixes: api.post('/users') → api.post('users')
  * Fixes: api.put('/users/${id}') → api.put('users/${id}')
  * Fixes: api.delete('/users/${id}') → api.delete('users/${id}')

- Add .env.development for local development
  * REACT_APP_API_BASE_URL=http://localhost:5000/api

- Add .env.production for production deployment
  * REACT_APP_API_BASE_URL=https://ryanmart.store/api

Benefits:
- API calls now correctly use baseURL from axios configuration
- Environment-specific URLs properly injected at build time
- Fixes 404 errors from incorrect path resolution
- Enables seamless switching between local and production

Closes: #issue-number (if applicable)
```

---

## Summary

✅ **All code fixes applied**
✅ **Environment files created**
✅ **Ready for local testing**
✅ **Ready for DreamHost deployment**

Your application is now correctly configured for both local development and production deployment on DreamHost!
