# Fix for "Unknown PG numeric type: 1043" Error

## Problem
The error `Unknown PG numeric type: 1043` occurs in `stock_tracking.py` when the `StockTrackingAggregatedResource.get()` method uses ORM queries for `Purchase`, `Sale`, and `SellerFruit` models.

## Root Cause
psycopg2 encounters an unknown PostgreSQL OID for numeric types when using ORM queries. The error code 1043 is related to PostgreSQL's `NUMERIC` type OID.

## Solution
Replace ORM queries with raw SQL queries using explicit `::text` casting for numeric fields (same pattern as in `purchases.py`).

## Files Modified
- `backend/resources/stock_tracking.py`

## Changes Made
1. ✅ Replaced `Purchase.query.all()` with raw SQL using `::text` casting
2. ✅ Replaced `Sale.query.filter()` calls with raw SQL using `::text` casting
3. ✅ Replaced `SellerFruit.query.all()` with raw SQL using `::text` casting

## ORM Queries Fixed (5 locations)
1. `StockTrackingAggregatedResource.get()` - Purchase query (line ~975)
2. `StockTrackingAggregatedResource.get()` - Sale query with date filter (line ~974)
3. `StockTrackingAggregatedResource.get()` - SellerFruit query (line ~1030)
4. `generate_stock_pdf_group()` - Sale query for stock out (line ~418)
5. `generate_stock_pdf_combined()` - Sale query for stocks out (line ~804)

## Status
✅ COMPLETED - All ORM queries replaced with raw SQL using `::text` casting

