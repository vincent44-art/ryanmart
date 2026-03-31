# TODO - Spolige Implementation Plan

## Task
Add spolige column to:
- Add Car Expense form in Driver Dashboard
- Add Car Expense form in CEO Dashboard (CarExpensesTab)
- Record Purchase form in Purchaser Dashboard
- Record Purchase form in CEO Dashboard (PurchaseFormModal)

Data Spoilage Tracker tab will flow to the in CEO Dashboard.

## Implementation Steps

### Backend
- [ ] 1. Add spolige field to DriverExpense model (backend/models/driver.py)
- [ ] 2. Add spolige field to Purchase model (backend/models/purchases.py)
- [ ] 3. Update purchases API to handle spolige field (backend/resources/purchases.py)
- [ ] 4. Update driver expenses API to handle spolige field (backend/resources/drivers.py)

### Frontend
- [ ] 5. Update DriverDashboard.jsx - Add spolige field to "Add Car Expense" form
- [ ] 6. Update PurchaserDashboard.jsx - Add spolige field to "Record Purchase" form
- [ ] 7. Update CarExpensesTab.jsx (CEO Dashboard) - Add spolige field
- [ ] 8. Update PurchaseFormModal.jsx (CEO Dashboard) - Add spolige field

## Status: In Progress
