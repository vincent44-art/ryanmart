# TODO: Swap Stock Tracking Overview and Records Tables

### Information Gathered:
- **StockTrackerTab.jsx**: Currently has "Stock Tracking Overview" table with grouped data by dateOut, showing summary for first 5 entries.
- **StockTrackingRecordsPage.jsx**: Currently has "Stock Tracking Records" table with detailed individual records, including download buttons.

### Plan:
- [x] Edit `frontend/src/components/StockTrackerTab.jsx`:
  - Change header from "Stock Tracking Overview" to "Stock Tracking Records".
  - Change button text from "View All Records" to "View Overview".
  - Replace the overview table with the detailed records table (copy from StockTrackingRecordsPage.jsx).
  - Add download handler functions (handleDownloadPDF, handleDownloadGroupPDF, handleDownloadCombinedPDF).
- [x] Edit `frontend/src/components/StockTrackingRecordsPage.jsx`:
  - Change title from "Stock Tracking Records" to "Stock Tracking Overview".
  - Change card header to "Stock Tracking Overview".
  - Replace the detailed table with the overview table (copy from StockTrackerTab.jsx).
  - Add data fetching for aggregated and sales data to compute overview.
  - Adjust navigation button if needed.

### Dependent Files to be edited:
- `frontend/src/components/StockTrackerTab.jsx`
- `frontend/src/components/StockTrackingRecordsPage.jsx`

### Followup steps:
- [x] Test the changes by running the app and navigating to the stock tracking tab and records page.
- [x] Ensure data loads correctly and download buttons work.
- [x] Replace the Stock Tracking Overview table with "Coming Soon" message in the overview page.
