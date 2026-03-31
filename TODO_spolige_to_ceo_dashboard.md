# Plan: Add Spolige Data to CEO Dashboard

## Information Gathered:
1. **PurchaseFormModal.jsx** - Already has spolige fields and creates spolige records when purchase is saved (stage: 'purchaser_stage')
2. **SpoligeTab.jsx** - Already has complete UI to display spolige records in CEO dashboard
3. **CEO Dashboard API (ceo_dashboard.py)** - Does NOT include spolige data in response
4. The `Dashboard.jsx` already imports and displays `SpoligeTab` component

## Plan:
1. **Backend Fix**: Update `backend/resources/ceo_dashboard.py` to include spolige data in the API response
   - Add import for Spolige model
   - Query spolige records from database
   - Include spolige data in the response

2. **Frontend Fix**: Update `frontend/src/api/dashboard.js` to handle the spolige data from the API response

## Dependent Files to be edited:
- `backend/resources/ceo_dashboard.py` - Add spolige data to CEO dashboard API
- `frontend/src/api/dashboard.js` - Handle spolige data in the API response

## Followup steps:
- Test the implementation by recording a purchase with spolige data
- Verify spolige appears in the CEO dashboard

