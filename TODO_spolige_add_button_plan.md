# Plan: Add SpoligeTab to Driver and Purchaser Dashboards

## Information Gathered:

1. **SpoligeTab.jsx** - A standalone component with:
   - "Add Spoilage" button in the header (already implemented)
   - Full CRUD operations (add, edit, delete)
   - Search functionality
   - Summary cards showing total records, quantity, and loss amount

2. **DriverDashboard.jsx** - Currently:
   - Has inline spolige form as part of the expense form (collapsible)
   - Does NOT use the SpoligeTab component
   - Creates spolige records with `stage: 'driver_stage'`

3. **PurchaserDashboard.jsx** - Currently:
   - Has inline spolige form as part of the purchase form (collapsible)
   - Does NOT use the SpoligeTab component
   - Creates spolige records with `stage: 'purchaser_stage'`

## Plan:

### 1. DriverDashboard.jsx
- Import SpoligeTab component
- Add SpoligeTab as a new section/tab alongside car expenses
- The SpoligeTab already has the "Add" button functionality

### 2. PurchaserDashboard.jsx
- Import SpoligeTab component
- Add SpoligeTab as a new section/tab alongside purchases
- The SpoligeTab already has the "Add" button functionality

## Files to Edit:
1. `frontend/src/pages/DriverDashboard.jsx`
2. `frontend/src/pages/PurchaserDashboard.jsx`

## Follow-up Steps:
- Test that the SpoligeTab renders correctly in both dashboards
- Verify the "Add" button works properly
