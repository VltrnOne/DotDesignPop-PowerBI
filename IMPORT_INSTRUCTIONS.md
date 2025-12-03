# DotDesignPop Power BI Dashboard - Import Instructions

## Project Files Overview

```
DotDesignPop_PowerBI_Project/
├── DotDesignPop_Theme.json      <- Power BI Theme file
├── DAX_Measures.dax             <- All DAX measures
├── IMPORT_INSTRUCTIONS.md       <- This file
├── DataModel/
│   └── relationships.json       <- Data model relationships reference
└── Report/
    └── report_layout.json       <- Visual layout reference
```

---

## STEP 1: Load Data into Power BI

1. **Open Power BI Desktop**

2. **Get Data > Excel**
   - Navigate to: `vltrndataroom/DotDesignPop_Ultimate_PowerBI_Dataset.xlsx`
   - Select **ALL 11 tables**:
     - Date_Dimension
     - Geography
     - SKU_Master
     - Clients
     - Inventory
     - Shipments
     - Service_Records
     - Jobs
     - Budget_Targets
     - Sales_Transactions
     - Performance_Over_Time
   - Click **Load**

---

## STEP 2: Apply the Theme

1. Go to **View** tab in Power BI
2. Click **Themes** dropdown
3. Select **Browse for themes...**
4. Navigate to `DotDesignPop_Theme.json`
5. Click **Open**

The theme will apply:
- Hot Pink (#FF1493) primary accent
- Electric Blue (#2563FF) secondary
- Modern card styling with rounded corners
- Professional typography

---

## STEP 3: Verify/Create Relationships

Power BI should auto-detect most relationships. Verify in **Model View**:

### Required Relationships:

| From Table | From Column | To Table | To Column | Cardinality |
|------------|-------------|----------|-----------|-------------|
| Date_Dimension | Date | Shipments | Ship_Date | 1:* |
| Date_Dimension | Date | Sales_Transactions | Transaction_Date | 1:* |
| Date_Dimension | Date | Service_Records | Service_Request_Date | 1:* |
| Date_Dimension | Date | Jobs | Order_Date | 1:* |
| Date_Dimension | Date | Inventory | Received_Date | 1:* |
| Geography | Location_ID | Clients | Location_ID | 1:* |
| SKU_Master | SKU_Code | Inventory | SKU_Code | 1:* |
| SKU_Master | SKU_Code | Shipments | SKU_Code | 1:* |
| SKU_Master | SKU_Code | Sales_Transactions | SKU_Code | 1:* |
| Clients | Client_ID | Jobs | Client_ID | 1:* |
| Clients | Client_ID | Shipments | Client_ID | 1:* |
| Clients | Client_ID | Sales_Transactions | Client_ID | 1:* |

### Mark Date_Dimension as Date Table:
1. Select `Date_Dimension` table
2. Click **Mark as date table**
3. Select `Date` column

---

## STEP 4: Create Measures Table

1. Go to **Home** > **Enter Data**
2. Create empty table named `Measures`
3. Click **Load**

---

## STEP 5: Add DAX Measures

Open `DAX_Measures.dax` file and copy measures into Power BI:

### Quick Method:
1. Select `Measures` table in Fields pane
2. Go to **Modeling** > **New measure**
3. Copy/paste each measure from the .dax file

### Organize by Display Folder:
After creating measures, organize them:
1. Select a measure
2. In Properties pane, set **Display folder**

**Folder Structure:**
- Revenue & Financial
- Inventory
- Shipments
- Service
- Time Intelligence
- Customer Analytics
- Product Performance
- Variance Analysis
- Regional Performance
- KPI Status

---

## STEP 6: Build Report Pages

Create 7 pages matching `report_layout.json`:

### Page 1: Executive Dashboard (Home)
**Top Row - Cards:**
- Total Revenue
- Gross Profit
- Profit Margin %
- YoY Growth %

**Center:**
- Line Chart: Revenue Trend (Current vs Last Year)
- Filled Map: Revenue by State

**Bottom:**
- Donut Chart: Revenue by Product Category
- KPI: Service Completion Rate
- Clustered Column: Shipments by Region

**Slicers:** Year, Quarter, VIP Status

---

### Page 2: Inventory Analytics
**Cards:** Units in Stock, Inventory Value, Units Shipped, Avg Days in Stock

**Visuals:**
- Stacked Bar: Inventory Status by SKU
- Matrix: Inventory by SKU and Status
- Treemap: Inventory Value Distribution
- Line+Column Combo: Monthly Shipments with 3M Average

---

### Page 3: Shipment Performance
**Gauges:** On-Time Delivery %, Service Completion %, Customer Satisfaction

**Visuals:**
- Bubble Map: Shipments by Location
- Waterfall: Shipping Cost by Carrier
- Funnel: Shipment Status
- Ribbon Chart: Shipments by Region Over Time

---

### Page 4: Service Analytics
**Cards:** Total Service Requests, Completed, Completion %, Avg Days

**Visuals:**
- Stacked Area: Service Status Over Time
- Clustered Column: Requests by Issue Type
- Scatter: Service Cost Analysis
- Matrix: Technician Performance

---

### Page 5: Revenue Deep Dive
**Visuals:**
- Line+Column Combo: Actual vs Budget
- Decomposition Tree: Revenue breakdown
- Key Influencers: What affects Profit Margin
- Table: Top 10 Customers

---

### Page 6: Customer Insights
**Cards:** Total Customers, Avg Revenue/Customer, VIP %, LTV

**Visuals:**
- Clustered Bar: Top 15 Customers
- Scatter: Customer Segmentation
- Pie: Revenue by Client Type
- Matrix: Customer Hierarchy

---

### Page 7: Operational Excellence
**Multi-row Card:** Revenue Achievement, On-Time Delivery, Service Completion, Warranty Claims

**Visuals:**
- Line Chart: Weekly Performance Trends
- Clustered Column: Monthly Variance
- Table: Monthly Scorecard

---

## STEP 7: Add Interactivity

### Slicers (on each page):
- Date_Dimension[Year] - Dropdown
- Date_Dimension[Quarter] - Buttons
- Relevant dimension filters

### Bookmarks:
1. View > Bookmarks pane
2. Create: "Executive View", "Detailed View", "YTD Performance", "Last Quarter"

### Drill-through:
1. Create hidden drill-through pages
2. Add drill-through fields (Client_ID, SKU_Code, Serial_Number)

### Navigation Buttons:
1. Insert > Buttons > Navigator
2. Configure page navigation

---

## STEP 8: Format & Polish

### Apply Consistent Formatting:
- All visuals use theme colors
- Card values: 24-48pt Segoe UI Semibold
- Titles: 14-16pt Segoe UI Bold
- Labels: 11pt Segoe UI

### Add Visual Effects:
- Border radius: 8px
- Drop shadow: Subtle
- Background: White with light border

### Enable Features:
- Tooltips: ON
- Data labels: Where appropriate
- Cross-filtering: Edit interactions

---

## STEP 9: Save & Test

1. **Save** as `DotDesignPop_Dashboard.pbix`
2. **Test** all slicers and cross-filtering
3. **Verify** calculations match expected values
4. **Check** all pages render correctly

---

## Quick Reference: Key DAX Measures

```dax
// Most Important Measures
Total Revenue = SUM(Sales_Transactions[Net_Price])
Gross Profit = [Total Revenue] - [Total Cost]
Revenue YoY Growth = DIVIDE([Total Revenue] - [Revenue SPLY], [Revenue SPLY], 0) * 100
On-Time Delivery % = (delivered on time / total delivered) * 100
Service Completion % = DIVIDE([Completed Services], [Total Service Requests], 0) * 100
```

---

## Support

For questions or issues:
- VLTRN: Info@VLTRN.agency
- Phone: +63 954 462 3187
- Web: www.VLTRN.agency

---

**Generated for DotDesignPop by VLTRN**
