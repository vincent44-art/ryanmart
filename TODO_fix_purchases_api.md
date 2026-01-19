# Fix PurchaserDashboard API 404 Error

## Issues Identified:
1. Missing blueprint registration: `purchases_bp` not registered in app.py
2. Typo in URLs: `fronntend` and `bacckend` should be `frontend` and `backend`

## Tasks Completed:

### backend/app.py
- [x] Fixed URL typos:
  - `ryanmart-fronntend` → `ryanmart-frontend`
  - `ryanmart-bacckend` → `ryanmart-backend`
- [x] Added import: `from resources.purchases import purchases_bp`
- [x] Registered blueprint: `app.register_blueprint(purchases_bp, url_prefix='/api')`

### backend/resources/purchases.py
- [x] Updated `get_purchases_by_email` to use `make_response_data()` helper for consistency

### backend/config.py
- [x] Fixed CORS origin URLs:
  - `ryanmart-fronntend.onrender.com` → `ryanmart-frontend.onrender.com`
  - `ryanmart-bacckend.onrender.com` → `ryanmart-backend.onrender.com`

### frontend/src/services/api.js
- [x] Updated comments to show correct URLs:
  - `ryanmart-fronntend.onrender.com` → `ryanmart-frontend.onrender.com`
  - `ryanmart-bacckend.onrender.com` → `ryanmart-backend.onrender.com`

## Summary of Changes:

The main issues were:
1. The `purchases_bp` Blueprint was defined in `resources/purchases.py` but never registered in the main Flask app (`app.py`), causing all `/api/purchases/by-email/<email>` requests to return 404.
2. Multiple files had typos in the Render.com URLs (`fronntend` instead of `frontend`, `bacckend` instead of `backend`), causing API calls to go to wrong URLs.

After these fixes, the API endpoints should work correctly:
- `/api/purchases/by-email/<email>` - Get purchases by email
- `/api/purchases` - Get all purchases / create new purchase


