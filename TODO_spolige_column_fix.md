# TODO: Move Spolige Column to End of Table

## Task: Move the Spolige column to the end of the table in both CarExpensesTab and PurchasesTab

### Changes Required:

1. **CarExpensesTab.jsx**:
   - Move "Spolige" column from position 6 to the end (before Actions)
   - Current order: Type, Description, Car Name, Car Number Plate, Stock Name, Spolige, Amount, Date, Driver, Actions
   - New order: Type, Description, Car Name, Car Number Plate, Stock Name, Amount, Date, Driver, Spolige, Actions

2. **PurchasesTab.jsx**:
   - Move "Spolige" column from position 7 to the end (before Actions)
   - Current order: Date, Purchaser, Fruit, Quantity, Unit, Farmer, Spolige, Amount per KG, Total Amount, Actions
   - New order: Date, Purchaser, Fruit, Quantity, Unit, Farmer, Amount per KG, Total Amount, Spolige, Actions

### Status:
- [ ] Update CarExpensesTab.jsx
- [ ] Update PurchasesTab.jsx
