# RyanMart Project TODO Tracker

## 🚀 Priority 1 - CRITICAL (Breaking Changes)
- [x] Fix purchase 500 error (model numeric types + data mapping) ✅ COMPLETE
  - Model: cost, amount_per_kg → Float
  - Resource: added float() conversion + validation
  - Indentation fixed
  - Update models/purchases.py → cost, amount_per_kg → Float
  - Align resources/purchases.py constructor params
  - Run alembic migration
  - Test PurchaserDashboard form submission
- [ ] Generate & run Alembic migration for purchase model changes
- [ ] Test full purchase flow → CEO dashboard sync
- [ ] Backend restart & production deploy

## 🔧 Priority 2 - HIGH (API Stability)
- [ ] Fix remaining 500 errors (car_expenses, other_expenses, etc.)
- [ ] Complete CORS fixes for production deploy
- [ ] Fix login/session expiry handling
- [ ] Stock tracking API improvements

## 📱 Frontend Improvements
- [ ] Update all dashboards for real-time sync
- [ ] Fix PDF generation edge cases
- [ ] Add loading states & better error UX

## 🛠️ Backend Refactoring
- [ ] Consistent numeric types across all models (Float vs String)
- [ ] Add comprehensive API validation
- [ ] Improve error logging & monitoring

## 🚀 Deployment
- [ ] Production CORS config (exact frontend URL)
- [ ] Environment variable validation
- [ ] Health checks & monitoring

**Current Status: Fixing purchase 500 error → Step 1/5 complete**

