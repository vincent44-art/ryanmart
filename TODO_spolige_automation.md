# Spolige Automation Implementation Plan

## Backend Changes
- [ ] 1. Add stock_tracking_id field to Spolige model (optional for linking)
- [ ] 2. Modify `backend/resources/stock_tracking.py` - Add automatic spolige record creation when spoilage > 0 during stock out
- [ ] 3. Set automatic spolige records with stage 'fully_spoiled' and description indicating source

## Frontend Changes
- [ ] 4. Update SpoligeTab to distinguish automatic vs manual records (add source indicator)
- [ ] 5. Allow editing/deleting of automatic records for corrections

## Testing
- [ ] 6. Test the automation by creating stock out records with spoilage
- [ ] 7. Verify spolige records are created automatically
