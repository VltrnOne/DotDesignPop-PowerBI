# DotDesignPop Power BI - Slicer Reference Guide

## Overview

Slicers are interactive filter controls that allow users to dynamically filter all visuals on a page. When you select a value in a slicer, all charts, cards, and tables on that page will update to show only data matching your selection.

---

## Global Slicer Configuration

All slicers are configured to:
- **Multi-select**: Hold Ctrl/Cmd to select multiple values
- **Search enabled**: Type to search in dropdown slicers
- **Select All**: Quick option to select/deselect all values
- **Cross-filter**: Selections affect all visuals on the page

---

## Page-by-Page Slicer Guide

### Dashboard (Home Page)

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| Region | Geography[Region] | Dropdown | Filter by geographic region (e.g., Northeast, Southwest) |
| Client | Clients[Client_Name] | Dropdown (searchable) | Filter by specific client name |
| Product Category | SKU_Master[Category] | Dropdown | Filter by product category |
| Year | Date_Dimension[Year] | Dropdown | Filter by year |
| Quarter | Date_Dimension[Quarter] | Buttons | Q1, Q2, Q3, Q4 selection |
| VIP Status | Clients[VIP_Status] | Buttons | Gold, Platinum, Standard |
| Clear All | - | Button | Reset all filters to default |

**Example Use Case:**
> Select "Southeast" region + "2024" year + "Platinum" VIP status to see only high-value clients in the Southeast for 2024.

---

### Warehouse / Storage Page

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| Region | Geography[Region] | Dropdown | Filter inventory by region |
| Warehouse Location | Inventory[Location] | Dropdown | Filter by specific warehouse |
| Product/SKU | SKU_Master[Product_Name] | Dropdown (searchable) | Filter by specific product |
| Inventory Status | Inventory[Status] | Buttons | In Stock, Shipped, Pending, etc. |
| Year | Date_Dimension[Year] | Dropdown | Filter by received year |
| Received Date Range | Date_Dimension[Date] | Date Range | Custom date range filter |

**Example Use Case:**
> Select "Phoenix Warehouse" + "In Stock" status to see only available inventory in Phoenix.

---

### Shipments Page

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| Region | Geography[Region] | Dropdown | Filter shipments by destination region |
| Client | Clients[Client_Name] | Dropdown (searchable) | Filter by recipient client |
| Delivery Status | Shipments[Delivery_Status] | Buttons | In Transit, Delivered, Pending, etc. |
| Carrier | Shipments[Carrier] | Dropdown | Filter by shipping carrier (UPS, FedEx, etc.) |
| Shipment Type | Shipments[Shipment_Type] | Dropdown | Filter by shipment type |
| Ship Date Range | Date_Dimension[Date] | Date Range | Filter by ship date |

**Example Use Case:**
> Select "In Transit" + "FedEx" to see all active FedEx shipments currently in transit.

---

### Warranty & Service Page

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| Serial Number | Service_Records[Serial_Number] | Dropdown (searchable) | Filter by specific unit serial number |
| Warranty Status | Service_Records[Warranty_Status] | Buttons | Under Warranty, Expired |
| Service Status | Service_Records[Service_Status] | Dropdown | Requested, Scheduled, In Progress, Completed |
| Issue Type | Service_Records[Issue_Type] | Dropdown | Filter by type of service issue |
| Priority | Service_Records[Priority] | Buttons | High, Medium, Low |
| Service Date Range | Date_Dimension[Date] | Date Range | Filter by service request date |

**Example Use Case:**
> Select "Under Warranty" + "High" priority to see urgent warranty service requests.

---

### Revenue Page

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| Year | Date_Dimension[Year] | Dropdown | Filter revenue by year |
| Quarter | Date_Dimension[Quarter] | Buttons | Filter by quarter |

---

### Customers Page

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| VIP Status | Clients[VIP_Status] | List | Filter by VIP tier |
| Region | Geography[Region] | Dropdown | Filter by customer region |

---

### Operations Page

| Slicer | Field | Type | Description |
|--------|-------|------|-------------|
| Year | Date_Dimension[Year] | Dropdown | Filter by year |
| Region | Geography[Region] | List | Filter by region |

---

## Slicer Types Explained

### Dropdown Slicer
- Click to open a list of values
- Type to search (if search enabled)
- Select multiple by holding Ctrl/Cmd
- Best for: Long lists of values

### Button Slicer
- Displays all options as clickable buttons
- Click to select/deselect
- Best for: Small number of options (2-6 values)

### Date Range Slicer
- Shows a calendar picker
- Select start and end dates
- Best for: Custom time period filtering

### List Slicer
- Displays values as a vertical list
- Checkboxes for multi-select
- Best for: Medium-sized lists with visible options

---

## Best Practices

### Filtering Data Effectively

1. **Start Broad, Then Narrow**
   - Begin with time period (Year/Quarter)
   - Then add region or client filters
   - Finally add specific status filters

2. **Use Clear All Button**
   - Reset all filters when starting new analysis
   - Prevents confusion from forgotten filters

3. **Check Active Filter Count**
   - Dashboard shows count of active filters
   - Remember to clear filters after analysis

### Common Analysis Scenarios

| Scenario | Recommended Slicers |
|----------|---------------------|
| Regional Performance | Region + Year + Quarter |
| Client Deep Dive | Client + Date Range |
| Inventory Check | Location + Status + SKU |
| Service Backlog | Service Status + Priority + Warranty Status |
| Shipping Analysis | Carrier + Delivery Status + Region |

---

## Troubleshooting

### "No Data" Displayed
- Check if conflicting slicers are selected
- Clear all filters and start fresh
- Verify date range includes data

### Slicer Shows No Values
- Related table may have no matching records
- Check if upstream slicers are filtering out data

### Values Not Filtering Correctly
- Verify relationships in data model
- Check that slicer field is connected to visuals

---

## Data Fields Reference

### Geography Table
- `Region`: Northeast, Southeast, Midwest, Southwest, West
- `State`: Full state names
- `City`: City names

### Clients Table
- `Client_Name`: Company/customer name
- `Client_Type`: Classification type
- `VIP_Status`: Gold, Platinum, Standard

### SKU_Master Table
- `Product_Name`: Product display name
- `Category`: Product category
- `SKU_Code`: Unique product identifier

### Date_Dimension Table
- `Year`: 2023, 2024, 2025
- `Quarter`: Q1, Q2, Q3, Q4
- `Month_Name`: January - December
- `Date`: Full date for range selection

### Inventory Table
- `Status`: In Stock, Shipped, Pending, In Transit, Delivered
- `Location`: Warehouse location names

### Shipments Table
- `Delivery_Status`: Pending, In Transit, Out for Delivery, Delivered
- `Carrier`: UPS, FedEx, DHL, etc.
- `Shipment_Type`: Standard, Express, Freight

### Service_Records Table
- `Warranty_Status`: Under Warranty, Expired
- `Service_Status`: Requested, Scheduled, In Progress, Completed
- `Issue_Type`: Service issue categories
- `Priority`: High, Medium, Low
- `Serial_Number`: Unit serial number

---

**Generated for DotDesignPop by VLTRN**
