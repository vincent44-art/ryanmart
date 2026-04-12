# CORS Final Fix - Proper OPTIONS Preflight for Login API

## Diagnosis (Confirmed)
- Preflight OPTIONS to `/api/auth/login` returns HTTP 200 with HTML `<!DOCTYPE html>` instead of empty 204
- **Missing `Access-Control-Allow-Headers`** despite Flask-CORS config (causes browser "content-type not allowed")
- Flask-RESTful `Api()` routes bypass some `@after_request` CORS logic for OPTIONS preflight
- Backend healthy, origins correct per `/api/health`

## Fix Plan
**Primary fix:** Explicit OPTIONS handler + force ACAH in `@after_request`

**Files to edit:**
1. `backend/app.py` - Add explicit OPTIONS route + enhance CORS/@after_request
2. Verify `backend/config.py` origins (already correct)

## Step-by-Step Implementation
### Step 1: Create explicit OPTIONS route for /api/auth/login [PENDING]
Add before `api = Api(app)`:
```python
@app.route('/api/auth/login', methods=['OPTIONS'])
def auth_login_options():
    response = make_response('', 204)
    origin = request.headers.get('Origin')
    if origin in current_app.config['ALLOWED_ORIGINS']:
        response.headers['Access-Control-Allow-Origin'] = origin
