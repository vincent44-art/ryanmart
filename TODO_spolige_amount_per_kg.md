# TODO: Add Spolige Amount Per KG to Purchase Form and Car Expenses

## Task
Add UI fields for spolige quantity (KG) and amount per KG in both:
1. PurchaseFormModal (Record Purchase)
2. CarExpensesTab (Add Car Expense)

This allows users to specify spoilage details that will be displayed in the CEO dashboard's Spoilage Tracker tab.

## Steps Completed:
- [x] Analyzed existing codebase - backend already supports spolige with quantity and amount_per_kg
- [x] Updated PurchaseFormModal.jsx - Added UI fields for spoligeQty and spoligeAmountPerKg
- [x] Added auto-calculation for spolige total amount using useEffect
- [x] Updated handleSubmit to use the spoligeTotal field properly
- [x] Updated reset form to include new spolige fields
- [x] Updated CarExpensesTab.jsx - Added UI fields for spoligeQty and spoligeAmountPerKg
- [x] Added auto-calculation for spolige total in Car Expenses
- [x] Updated handleSubmit in Car Expenses to use the spoligeTotal field properly
- [x] Updated reset form in Car Expenses to include new spolige fields

## Files Edited:
- frontend/src/components/PurchaseFormModal.jsx
- frontend/src/components/CarExpensesTab.jsx

## Summary of Changes:
### PurchaseFormModal.jsx:
1. Added `useEffect` import
2. Added `spoligeTotal` field to form state
3. Added `useEffect` hook to auto-calculate spolige total when quantity or amount per kg changes
4. Added UI section with three fields:
   - Spolige Quantity (KG)
   - Amount per KG (KES)
   - Total Spolige Amount (KES) - auto-calculated, read-only
5. Updated handleSubmit to properly use spoligeTotal when creating spolige record
6. Updated reset form to include all new spolige fields
7. Spolige stage: 'purchaser_stage'

### CarExpensesTab.jsx:
1. Added `useEffect` import (already had it)
2. Added `spoligeQty`, `spoligeAmountPerKg`, `spoligeTotal` fields to form state
3. Added `useEffect` hook to auto-calculate spolige total when quantity or amount per kg changes
4. Added UI section with three fields:
   - Spolige Quantity (KG)
   - Amount per KG (KES)
   - Total Spolige Amount (KES) - auto-calculated, read-only
5. Updated handleSubmit to properly use spoligeTotal when creating spolige record
6. Updated reset form to include all new spolige fields
7. Spolige stage: 'driver_stage'

