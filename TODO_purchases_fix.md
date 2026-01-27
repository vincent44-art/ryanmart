# Purchases Fix TODO List

## Task: Fix JWT verification in PurchaseByEmailResource and simplify PurchasesTab

### Step 1: Fix JWT verification in PurchaseByEmailResource
- [x] Read and analyze backend/resources/purchases.py
- [x] Add verify_jwt_in_request() call in PurchaseByEmailResource.get()
- [x] Import verify_jwt_in_request from flask_jwt_extended

### Step 2: Modify PurchasesTab component
- [x] Read and analyze frontend/src/components/PurchasesTab.jsx
- [x] Remove "Add Purchase" button from header
- [x] Remove showAddModal state
- [x] Remove PurchaseFormModal import and component

### Step 3: Testing
- [ ] Test the purchases API endpoint with JWT authentication
- [ ] Verify frontend displays purchases correctly without add form

