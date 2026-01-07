# CORS Fix Plan

## Problem
The frontend running on localhost:3001 cannot communicate with the backend on localhost:5000 due to CORS policy not being properly configured.

## Root Cause
- Flask-CORS is installed in requirements.txt but NOT initialized in app.py
- Only SocketIO has CORS configuration, not the main Flask REST API
- Missing localhost:3001 in allowed origins

## Solution
1. Import CORS from flask_cors
2. Initialize CORS with proper origins including localhost:3001

## File to Edit
- `/home/vincent/ryanmart/backend/app.py`

## Steps Completed
- [x] Analyze the issue
- [x] Read backend/app.py
- [x] Read backend/resources/__init__.py
- [x] Read backend/requirements.txt
- [x] Create this plan
- [x] Add CORS import to app.py
- [x] Initialize CORS with proper origins
- [x] Restart backend server

## Changes Made to backend/app.py
1. Added import: `from flask_cors import CORS`
2. Added CORS initialization with origins for localhost:3000, localhost:3001, and render.com
3. Updated SocketIO cors_allowed_origins to include localhost:3001

## ESLint Warnings Fixed
- **OtherExpensesTab.jsx**: Added `authToken` to useEffect dependencies
- **StockTrackerTab.jsx**: 
  - Added `navigate` and `loadData` to useEffect dependencies
  - Added eslint-disable comments for unused variables (`handleTrackStock`, `handleViewProfitLoss`, `stockExpensesArr`, `groupedStocksArray`)
- **ChangePassword.jsx**: Removed unused `logout` variable

