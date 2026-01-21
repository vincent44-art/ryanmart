# CEO Dashboard Purchase Tab Fix

## Issue
In the purchaser tab of the CEO dashboard, when adding a new item, it was saved to the database but not displayed in the table immediately.

## Root Cause
The PurchasesTab component was receiving purchase data as props from the Dashboard component. When a new purchase was added, PurchasesTab updated its local state, but this didn't affect the parent Dashboard's data, which was managed by the useDashboardData hook.

## Solution
1. Added `handlePurchaseAdded` function in Dashboard.jsx that calls `refetch()` to reload dashboard data.
2. Passed `onPurchaseAdded` prop to PurchasesTab component.
3. Modified PurchasesTab's `handleAddPurchase` to use the prop callback when available, falling back to local state update for standalone usage.

## Files Modified
- frontend/src/pages/Dashboard.jsx: Added handlePurchaseAdded function and passed it to PurchasesTab
- frontend/src/components/PurchasesTab.jsx: Updated handleAddPurchase to use prop callback

## Status
✅ Fixed - New purchases now appear in the table immediately after being added.
