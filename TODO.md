# API 404 Fixes - Blueprint/Resource Registration
Status: ✅ Approved & In Progress

## Step 1: [x] Create TODO.md ✅
## Step 2: Fix backend/resources/__init__.py - Export all blueprints
## Step 3: Update backend/resources/sales.py - Add blueprint + register SaleByEmailResource  
## Step 4: Update backend/app.py - Import/register all blueprints
## Step 5: Test endpoints `cd backend && python -m flask --app app.py routes`
## Step 6: Browser test: Login → Driver/Seller dashboard (no 404s)
## Step 7: attempt_completion

**Goal**: Fix all post-login 404s (drivers/{email}/expenses, sales/email/{email})

