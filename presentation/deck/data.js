/**
 * Saint James Cooler Portfolio - JOB #6456
 * Data V - Powered by VLTRN
 *
 * SOURCE DATA (from Forecast Tracker):
 * - Fit Cooler (Bodega/C-Store Model): 79 units - SKU: SJ-FIT-001
 * - SC190L Hero (G10 EQ): 44 units - SKU: SJ-SC190L
 * - SC68L Hero (G1.5 Eq): 118 units - SKU: SJ-SC68L
 * - Slimline Cooler (Smaller G9 EQ): 180 units - SKU: SJ-SLIM-001
 * - TOTAL: 421 units ordered for First Track distribution
 *
 * BUSINESS LOGIC:
 * - Forecast Tracker upload = PENDING (shipments en route TO warehouse)
 * - Arrival Document upload = ACTIVE (confirmed arrived at warehouse)
 * - Outbound shipping = EXITED (shipped OUT to clients)
 *
 * DEMO DISTRIBUTION:
 * - Pending (en route to warehouse): 48 units
 * - Active (confirmed in storage): 278 units
 * - Exited (shipped to clients): 95 units
 *   - In Transit: 32 units
 *   - Scheduling Delivery: 16 units
 *   - Delivered: 47 units
 * - Warranty Active: 240 units
 * - Service Requests: 7 units
 */

// ============================================================================
// PRODUCT DEFINITIONS
// ============================================================================
const PRODUCTS = [
    {
        sku: 'SJ-FIT-001',
        name: 'Fit Cooler (Bodega/C-Store Model)',
        shortName: 'Fit Cooler',
        serialPrefix: 'FIT',
        totalUnits: 79,
        cartonDimensions: '306x645x1650mm',
        perPallet: 6
    },
    {
        sku: 'SJ-SC190L',
        name: 'SC190L Hero (G10 EQ)',
        shortName: 'SC190L Hero',
        serialPrefix: '190L',
        totalUnits: 44,
        cartonDimensions: '576x606x1354mm',
        perPallet: 4
    },
    {
        sku: 'SJ-SC68L',
        name: 'SC68L Hero (G1.5 Eq)',
        shortName: 'SC68L Hero',
        serialPrefix: '68L',
        totalUnits: 118,
        cartonDimensions: '521x581x744mm',
        perPallet: 8
    },
    {
        sku: 'SJ-SLIM-001',
        name: 'Slimline Cooler (Smaller G9 EQ)',
        shortName: 'Slimline Cooler',
        serialPrefix: 'SLIM',
        totalUnits: 180,
        cartonDimensions: '540x570x1492mm',
        perPallet: 4
    }
];

// ============================================================================
// WAREHOUSE LOCATIONS
// ============================================================================
const LOCATIONS = [
    { id: 'atlanta', name: 'First Track - Atlanta', city: 'Atlanta', state: 'GA', region: 'Southeast' },
    { id: 'miami', name: 'First Track - Miami', city: 'Miami', state: 'FL', region: 'Southeast' },
    { id: 'houston', name: 'First Track - Houston', city: 'Houston', state: 'TX', region: 'Southwest' },
    { id: 'phoenix', name: 'First Track - Phoenix', city: 'Phoenix', state: 'AZ', region: 'Southwest' },
    { id: 'los-angeles', name: 'First Track - Los Angeles', city: 'Los Angeles', state: 'CA', region: 'West' },
    { id: 'charlotte', name: 'First Track - Charlotte', city: 'Charlotte', state: 'NC', region: 'Southeast' }
];

// ============================================================================
// CLIENT NAMES (Realistic convenience store and bodega names)
// ============================================================================
const CLIENTS = [
    { name: 'Corner Store ATL', city: 'Atlanta', state: 'GA' },
    { name: 'Bodega Miami Central', city: 'Miami', state: 'FL' },
    { name: 'Quick Mart Tampa', city: 'Tampa', state: 'FL' },
    { name: 'Metro Grocery Houston', city: 'Houston', state: 'TX' },
    { name: 'Desert Mart Phoenix', city: 'Phoenix', state: 'AZ' },
    { name: 'C-Store Charlotte', city: 'Charlotte', state: 'NC' },
    { name: 'LA Bodega Express', city: 'Los Angeles', state: 'CA' },
    { name: 'Sunshine Market Orlando', city: 'Orlando', state: 'FL' },
    { name: 'Gulf Coast Grocery', city: 'New Orleans', state: 'LA' },
    { name: 'Peachtree Mini Mart', city: 'Atlanta', state: 'GA' },
    { name: 'South Beach Bodega', city: 'Miami Beach', state: 'FL' },
    { name: 'Bayou Quick Stop', city: 'Baton Rouge', state: 'LA' },
    { name: 'Lone Star Convenience', city: 'Dallas', state: 'TX' },
    { name: 'Cactus Corner Store', city: 'Tucson', state: 'AZ' },
    { name: 'Pacific Market LA', city: 'Los Angeles', state: 'CA' },
    { name: 'Carolina Corner', city: 'Raleigh', state: 'NC' },
    { name: 'Magnolia Market', city: 'Jackson', state: 'MS' },
    { name: 'Everglades Express', city: 'Fort Lauderdale', state: 'FL' },
    { name: 'Alamo Quick Mart', city: 'San Antonio', state: 'TX' },
    { name: 'Palm Springs Bodega', city: 'Palm Springs', state: 'CA' },
    { name: 'Riverside Grocery', city: 'Riverside', state: 'CA' },
    { name: 'Downtown Dallas Market', city: 'Dallas', state: 'TX' },
    { name: 'Coral Gables Store', city: 'Coral Gables', state: 'FL' },
    { name: 'Midtown ATL Mart', city: 'Atlanta', state: 'GA' },
    { name: 'Westside LA Bodega', city: 'Los Angeles', state: 'CA' },
    { name: 'Scottsdale Quick Stop', city: 'Scottsdale', state: 'AZ' },
    { name: 'Uptown Charlotte Store', city: 'Charlotte', state: 'NC' },
    { name: 'Heights Houston Mart', city: 'Houston', state: 'TX' },
    { name: 'Brickell Bodega', city: 'Miami', state: 'FL' },
    { name: 'Buckhead Express', city: 'Atlanta', state: 'GA' },
    { name: 'Tempe Market', city: 'Tempe', state: 'AZ' },
    { name: 'Hollywood Bodega', city: 'Hollywood', state: 'CA' },
    { name: 'Galveston Grocery', city: 'Galveston', state: 'TX' },
    { name: 'Key West Corner', city: 'Key West', state: 'FL' },
    { name: 'Savannah Market', city: 'Savannah', state: 'GA' },
    { name: 'Mesa Quick Mart', city: 'Mesa', state: 'AZ' },
    { name: 'Long Beach Store', city: 'Long Beach', state: 'CA' },
    { name: 'Austin Express', city: 'Austin', state: 'TX' },
    { name: 'Naples Bodega', city: 'Naples', state: 'FL' },
    { name: 'Decatur Market', city: 'Decatur', state: 'GA' }
];

// ============================================================================
// CARRIERS
// ============================================================================
const CARRIERS = [
    { id: 'first-track', name: 'First Track Logistics', prefix: 'FT' },
    { id: 'fedex', name: 'FedEx Freight', prefix: 'FX' },
    { id: 'ups', name: 'UPS Freight', prefix: 'UP' },
    { id: 'xpo', name: 'XPO Logistics', prefix: 'XP' }
];

// ============================================================================
// STATUS DEFINITIONS
// ============================================================================
const WAREHOUSE_STATUS = {
    PENDING: 'pending',      // Shipment en route TO warehouse (from Forecast Tracker)
    ACTIVE: 'active',        // Confirmed arrived at warehouse (from Arrival Document)
    EXITED: 'exited'         // Shipped OUT to clients
};

const SHIPMENT_STATUS = {
    IN_TRANSIT: 'in-transit',
    SCHEDULING: 'scheduling',
    DELIVERED: 'delivered'
};

const WARRANTY_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired'
};

const SERVICE_STATUS = {
    NO_ISSUES: 'no-issues',
    REQUESTED: 'requested',
    SCHEDULING: 'in-scheduling',
    SCHEDULED: 'scheduled',
    COMPLETED: 'completed'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function generateSerialNumber(productPrefix, index) {
    return `SJ-6456-${productPrefix}-${String(index).padStart(4, '0')}`;
}

function generateTrackingNumber(carrier, index) {
    const year = 2024;
    return `${carrier.prefix}-${year}-${String(78000 + index).padStart(5, '0')}`;
}

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============================================================================
// GENERATE ALL 421 UNITS
// ============================================================================
function generateAllUnits() {
    const units = [];
    let globalIndex = 0;

    // Distribution targets based on requirements:
    // - Pending Arrival: 48 units
    // - Active in Storage: 280 units
    // - Exited (Ready to Ship + In Transit + Scheduling + Delivered): 93 units
    //   - In Transit: 32
    //   - Scheduling: 16
    //   - Delivered: 247 (this comes from exited units becoming delivered over time)

    // Actually let me recalculate:
    // Total: 421 units
    // Pending Arrival: 48 (these haven't arrived yet - next shipment)
    // In warehouse tracking: 421 - 48 = 373 units that have arrived
    //   - Active in Storage: 280
    //   - Exited Warehouse: 93
    //     - But exited includes shipped units which can be:
    //       - In Transit: 32
    //       - Scheduling: 16
    //       - Delivered: 45 (93 - 32 - 16 = 45)
    //
    // Separately, 247 is historical delivered count (cumulative)
    // This means 247 units have been delivered total over the program
    // Let's make this make sense:
    // - 48 pending (not arrived)
    // - 280 active in storage
    // - 93 exited/shipped out recently
    // Warranty tracking: 247 delivered units with active warranties

    PRODUCTS.forEach(product => {
        for (let i = 1; i <= product.totalUnits; i++) {
            globalIndex++;
            units.push({
                id: globalIndex,
                serialNumber: generateSerialNumber(product.serialPrefix, i),
                sku: product.sku,
                productName: product.name,
                shortName: product.shortName,
                serialPrefix: product.serialPrefix,
                cartonDimensions: product.cartonDimensions,
                perPallet: product.perPallet,
                productIndex: i // index within this product type
            });
        }
    });

    return units;
}

// ============================================================================
// DISTRIBUTE UNITS ACROSS STATUSES AND LOCATIONS
// ============================================================================
function distributeUnits(units) {
    // Shuffle for random distribution
    const shuffled = shuffleArray([...units]);

    // Distribution counts - CORRECTED BUSINESS LOGIC
    // Forecast Tracker file = PENDING (shipments en route TO warehouse)
    // Arrival Document = ACTIVE (confirmed arrived at warehouse)
    // Outbound shipping = EXITED (shipped OUT to clients)
    const pendingCount = 48;   // Shipments en route TO warehouse (from forecast tracker)
    const exitedCount = 95;    // Units shipped OUT to clients
    const activeCount = 278;   // Units confirmed arrived at warehouse (421 - 48 - 95)

    // Further breakdown of exited (95 total)
    const inTransitCount = 32;    // Currently on trucks to clients
    const schedulingCount = 16;   // Picked up, scheduling delivery appointment
    const deliveredRecentCount = 47; // Recently delivered (95 - 32 - 16 = 47)

    // For warranty page, we show 247 "delivered" units
    // This includes the 45 recently delivered + 202 from earlier deliveries
    // But since we only have 421 units total, let's adjust:
    // We'll treat "delivered with warranty" as a subset that includes
    // recent deliveries plus some that were previously active but delivered earlier

    // Distribution across locations for active units
    const locationDistribution = {
        'atlanta': 0.25,      // 70 units
        'miami': 0.18,        // 50 units
        'houston': 0.20,      // 56 units
        'phoenix': 0.12,      // 34 units
        'los-angeles': 0.15,  // 42 units
        'charlotte': 0.10     // 28 units
    };

    let index = 0;

    // PENDING ARRIVAL UNITS (48)
    const pendingUnits = [];
    for (let i = 0; i < pendingCount && index < shuffled.length; i++, index++) {
        pendingUnits.push({
            ...shuffled[index],
            warehouseStatus: WAREHOUSE_STATUS.PENDING,
            location: null,
            locationName: 'Pending - In Transit to Warehouse',
            expectedArrival: formatDate(new Date(2024, 11, 15)), // Dec 15, 2024
            shipmentStatus: null,
            warrantyStatus: null,
            serviceStatus: null
        });
    }

    // ACTIVE IN STORAGE UNITS (280)
    const activeUnits = [];
    const locationKeys = Object.keys(locationDistribution);
    let locationIndex = 0;
    const locationCounts = {};
    locationKeys.forEach(loc => {
        locationCounts[loc] = Math.floor(activeCount * locationDistribution[loc]);
    });
    // Adjust for rounding
    const totalAssigned = Object.values(locationCounts).reduce((a, b) => a + b, 0);
    locationCounts['atlanta'] += (activeCount - totalAssigned);

    for (const [locId, count] of Object.entries(locationCounts)) {
        const location = LOCATIONS.find(l => l.id === locId);
        for (let i = 0; i < count && index < shuffled.length; i++, index++) {
            const receivedDate = new Date(2024, 1, 1 + Math.floor(Math.random() * 28)); // Feb 2024
            activeUnits.push({
                ...shuffled[index],
                warehouseStatus: WAREHOUSE_STATUS.ACTIVE,
                location: locId,
                locationName: location.name,
                city: location.city,
                state: location.state,
                receivedDate: formatDate(receivedDate),
                shipmentStatus: null,
                warrantyStatus: null,
                serviceStatus: null
            });
        }
    }

    // EXITED/SHIPPED UNITS (93)
    // Split into: In Transit (32), Scheduling (16), Recently Delivered (45)
    const exitedUnits = [];
    let trackingIndex = 1;
    let clientIndex = 0;

    // In Transit (32)
    for (let i = 0; i < inTransitCount && index < shuffled.length; i++, index++) {
        const carrier = CARRIERS[i % CARRIERS.length];
        const client = CLIENTS[clientIndex % CLIENTS.length];
        clientIndex++;
        const shipDate = new Date(2024, 10, 25 + (i % 7)); // Late Nov 2024

        exitedUnits.push({
            ...shuffled[index],
            warehouseStatus: WAREHOUSE_STATUS.EXITED,
            location: getRandomElement(locationKeys),
            locationName: 'Shipped',
            shipmentStatus: SHIPMENT_STATUS.IN_TRANSIT,
            carrier: carrier.name,
            carrierId: carrier.id,
            trackingNumber: generateTrackingNumber(carrier, trackingIndex++),
            client: client.name,
            destination: `${client.city}, ${client.state}`,
            shipDate: formatDate(shipDate),
            expectedDelivery: formatDate(addDays(shipDate, 5)),
            warrantyStatus: null,
            serviceStatus: null
        });
    }

    // Scheduling (16)
    for (let i = 0; i < schedulingCount && index < shuffled.length; i++, index++) {
        const carrier = CARRIERS[i % CARRIERS.length];
        const client = CLIENTS[clientIndex % CLIENTS.length];
        clientIndex++;
        const shipDate = new Date(2024, 10, 20 + (i % 10)); // Nov 2024

        exitedUnits.push({
            ...shuffled[index],
            warehouseStatus: WAREHOUSE_STATUS.EXITED,
            location: getRandomElement(locationKeys),
            locationName: 'Shipped',
            shipmentStatus: SHIPMENT_STATUS.SCHEDULING,
            carrier: carrier.name,
            carrierId: carrier.id,
            trackingNumber: generateTrackingNumber(carrier, trackingIndex++),
            client: client.name,
            destination: `${client.city}, ${client.state}`,
            shipDate: formatDate(shipDate),
            schedulingNote: 'Awaiting delivery appointment',
            warrantyStatus: null,
            serviceStatus: null
        });
    }

    // Recently Delivered (45) - these have warranty info
    for (let i = 0; i < deliveredRecentCount && index < shuffled.length; i++, index++) {
        const carrier = CARRIERS[i % CARRIERS.length];
        const client = CLIENTS[clientIndex % CLIENTS.length];
        clientIndex++;
        const deliveryDate = new Date(2024, 9, 1 + (i % 30)); // Oct 2024
        const warrantyExpires = addYears(deliveryDate, 1);

        // Assign service status (mostly no issues, some with requests)
        let serviceStatus = SERVICE_STATUS.NO_ISSUES;
        if (i < 3) serviceStatus = SERVICE_STATUS.SCHEDULED;
        else if (i < 7) serviceStatus = SERVICE_STATUS.REQUESTED;
        else if (i < 11) serviceStatus = SERVICE_STATUS.SCHEDULING;

        exitedUnits.push({
            ...shuffled[index],
            warehouseStatus: WAREHOUSE_STATUS.EXITED,
            location: getRandomElement(locationKeys),
            locationName: 'Delivered',
            shipmentStatus: SHIPMENT_STATUS.DELIVERED,
            carrier: carrier.name,
            carrierId: carrier.id,
            trackingNumber: generateTrackingNumber(carrier, trackingIndex++),
            client: client.name,
            destination: `${client.city}, ${client.state}`,
            deliveryDate: formatDate(deliveryDate),
            warrantyStatus: WARRANTY_STATUS.ACTIVE,
            warrantyExpires: formatDate(warrantyExpires),
            serviceStatus: serviceStatus,
            serviceRequestDate: serviceStatus !== SERVICE_STATUS.NO_ISSUES ? formatDate(addDays(deliveryDate, 30 + Math.floor(Math.random() * 60))) : null
        });
    }

    return {
        pending: pendingUnits,
        active: activeUnits,
        exited: exitedUnits,
        all: [...pendingUnits, ...activeUnits, ...exitedUnits]
    };
}

// ============================================================================
// GENERATE HISTORICAL DELIVERED UNITS FOR WARRANTY PAGE (247 total)
// ============================================================================
function generateWarrantyData(exitedUnits) {
    // Start with the recently delivered units that have warranty info
    const deliveredWithWarranty = exitedUnits.filter(u => u.shipmentStatus === SHIPMENT_STATUS.DELIVERED);

    // We need 247 total for warranty page
    // We have ~45 from recent deliveries
    // Generate 202 more "historical" deliveries from earlier months
    const historicalDeliveries = [];
    let clientIndex = 0;

    // Generate historical data for months Feb - Sep 2024
    for (let month = 1; month <= 8; month++) {
        const unitsThisMonth = month < 5 ? 30 : 20; // More in earlier months
        for (let i = 0; i < unitsThisMonth && historicalDeliveries.length < 202; i++) {
            const product = PRODUCTS[historicalDeliveries.length % PRODUCTS.length];
            const deliveryDate = new Date(2024, month, 1 + Math.floor(Math.random() * 28));
            const warrantyExpires = addYears(deliveryDate, 1);
            const client = CLIENTS[clientIndex % CLIENTS.length];
            clientIndex++;

            // Historical units mostly have no issues
            let serviceStatus = SERVICE_STATUS.NO_ISSUES;
            const rand = Math.random();
            if (rand < 0.02) serviceStatus = SERVICE_STATUS.COMPLETED;

            historicalDeliveries.push({
                id: 1000 + historicalDeliveries.length,
                serialNumber: generateSerialNumber(product.serialPrefix, 200 + historicalDeliveries.length),
                sku: product.sku,
                productName: product.name,
                shortName: product.shortName,
                client: client.name,
                destination: `${client.city}, ${client.state}`,
                deliveryDate: formatDate(deliveryDate),
                warrantyStatus: WARRANTY_STATUS.ACTIVE,
                warrantyExpires: formatDate(warrantyExpires),
                serviceStatus: serviceStatus,
                isHistorical: true
            });
        }
    }

    return [...deliveredWithWarranty, ...historicalDeliveries];
}

// ============================================================================
// MAIN DATA GENERATION
// ============================================================================
const allUnits = generateAllUnits();
const distributedUnits = distributeUnits(allUnits);
const warrantyUnits = generateWarrantyData(distributedUnits.exited);

// ============================================================================
// EXPORTED DATA OBJECTS
// ============================================================================
const DATA = {
    // Summary counts
    summary: {
        totalUnits: 421,
        pendingArrival: 48,      // Shipments en route TO warehouse (from forecast tracker)
        activeInventory: 278,    // Confirmed arrived at warehouse (from arrival document)
        exitedWarehouse: 95,     // Shipped OUT to clients
        inTransit: 32,
        schedulingDelivery: 16,
        delivered: 47,           // Recently delivered (95 - 32 - 16)
        activeWarranties: 240,
        warrantyRequests: 7,
        serviceScheduled: 3,
        serviceInScheduling: 4
    },

    // Product catalog
    products: PRODUCTS,

    // Location reference
    locations: LOCATIONS,

    // Carrier reference
    carriers: CARRIERS,

    // Client reference
    clients: CLIENTS,

    // All units with full data
    units: distributedUnits.all,

    // Units by warehouse status
    warehouse: {
        pending: distributedUnits.pending,
        active: distributedUnits.active,
        exited: distributedUnits.exited
    },

    // Shipment data (exited units with tracking)
    shipments: {
        inTransit: distributedUnits.exited.filter(u => u.shipmentStatus === SHIPMENT_STATUS.IN_TRANSIT),
        scheduling: distributedUnits.exited.filter(u => u.shipmentStatus === SHIPMENT_STATUS.SCHEDULING),
        delivered: distributedUnits.exited.filter(u => u.shipmentStatus === SHIPMENT_STATUS.DELIVERED),
        all: distributedUnits.exited
    },

    // Warranty data
    warranty: {
        all: warrantyUnits,
        active: warrantyUnits.filter(u => u.warrantyStatus === WARRANTY_STATUS.ACTIVE),
        withServiceRequests: warrantyUnits.filter(u => u.serviceStatus === SERVICE_STATUS.REQUESTED),
        inScheduling: warrantyUnits.filter(u => u.serviceStatus === SERVICE_STATUS.SCHEDULING),
        scheduled: warrantyUnits.filter(u => u.serviceStatus === SERVICE_STATUS.SCHEDULED),
        noIssues: warrantyUnits.filter(u => u.serviceStatus === SERVICE_STATUS.NO_ISSUES)
    },

    // Location-based groupings for warehouse page
    byLocation: {
        atlanta: distributedUnits.active.filter(u => u.location === 'atlanta'),
        miami: distributedUnits.active.filter(u => u.location === 'miami'),
        houston: distributedUnits.active.filter(u => u.location === 'houston'),
        phoenix: distributedUnits.active.filter(u => u.location === 'phoenix'),
        'los-angeles': distributedUnits.active.filter(u => u.location === 'los-angeles'),
        charlotte: distributedUnits.active.filter(u => u.location === 'charlotte')
    },

    // SKU-based groupings
    bySku: {
        'SJ-FIT-001': distributedUnits.all.filter(u => u.sku === 'SJ-FIT-001'),
        'SJ-SC190L': distributedUnits.all.filter(u => u.sku === 'SJ-SC190L'),
        'SJ-SC68L': distributedUnits.all.filter(u => u.sku === 'SJ-SC68L'),
        'SJ-SLIM-001': distributedUnits.all.filter(u => u.sku === 'SJ-SLIM-001')
    }
};

// ============================================================================
// FILTERING FUNCTIONS FOR UI
// ============================================================================
const FILTERS = {
    // Filter warehouse units by status
    filterWarehouseByStatus: function(status) {
        if (status === 'all') return DATA.units;
        if (status === 'pending') return DATA.warehouse.pending;
        if (status === 'active') return DATA.warehouse.active;
        if (status === 'exited') return DATA.warehouse.exited;
        return DATA.units;
    },

    // Filter warehouse units by location
    filterWarehouseByLocation: function(locationId) {
        if (locationId === 'all') return DATA.warehouse.active;
        return DATA.byLocation[locationId] || [];
    },

    // Filter warehouse units by both status and location
    filterWarehouse: function(status, locationId) {
        let units = this.filterWarehouseByStatus(status);
        if (locationId !== 'all' && status === 'active') {
            units = units.filter(u => u.location === locationId);
        }
        return units;
    },

    // Filter shipments by status
    filterShipmentsByStatus: function(status) {
        if (status === 'all') return DATA.shipments.all;
        if (status === 'picked-up' || status === 'in-transit') return DATA.shipments.inTransit;
        if (status === 'scheduling') return DATA.shipments.scheduling;
        if (status === 'history' || status === 'delivered') return DATA.shipments.delivered;
        return DATA.shipments.all;
    },

    // Filter shipments by carrier
    filterShipmentsByCarrier: function(carrierId) {
        if (carrierId === 'all') return DATA.shipments.all;
        return DATA.shipments.all.filter(u => u.carrierId === carrierId);
    },

    // Filter shipments by both
    filterShipments: function(status, carrierId) {
        let units = this.filterShipmentsByStatus(status);
        if (carrierId !== 'all') {
            units = units.filter(u => u.carrierId === carrierId);
        }
        return units;
    },

    // Filter warranty by status
    filterWarrantyByStatus: function(status) {
        if (status === 'all') return DATA.warranty.all;
        if (status === 'active') return DATA.warranty.active;
        if (status === 'requests') return DATA.warranty.withServiceRequests;
        if (status === 'in-scheduling') return DATA.warranty.inScheduling;
        if (status === 'scheduled') return DATA.warranty.scheduled;
        return DATA.warranty.all;
    },

    // Filter warranty by service status
    filterWarrantyByService: function(serviceStatus) {
        if (serviceStatus === 'all') return DATA.warranty.all;
        if (serviceStatus === 'no-issues') return DATA.warranty.noIssues;
        if (serviceStatus === 'requested') return DATA.warranty.withServiceRequests;
        if (serviceStatus === 'scheduled') return DATA.warranty.scheduled;
        return DATA.warranty.all;
    },

    // Filter warranty by both
    filterWarranty: function(status, serviceStatus) {
        let units = this.filterWarrantyByStatus(status);
        if (serviceStatus !== 'all') {
            units = units.filter(u => {
                if (serviceStatus === 'no-issues') return u.serviceStatus === SERVICE_STATUS.NO_ISSUES;
                if (serviceStatus === 'requested') return u.serviceStatus === SERVICE_STATUS.REQUESTED;
                if (serviceStatus === 'scheduled') return u.serviceStatus === SERVICE_STATUS.SCHEDULED;
                return true;
            });
        }
        return units;
    },

    // Get counts for current filter state
    getCounts: function(warehouseStatus, warehouseLocation, shipmentStatus, shipmentCarrier, warrantyStatus, warrantyService) {
        return {
            warehouse: {
                pending: warehouseStatus === 'pending' ? DATA.warehouse.pending.length : DATA.summary.pendingArrival,
                active: warehouseStatus === 'active' ? this.filterWarehouse('active', warehouseLocation).length : DATA.summary.activeInventory,
                exited: warehouseStatus === 'exited' ? DATA.warehouse.exited.length : DATA.summary.exitedWarehouse,
                total: this.filterWarehouse(warehouseStatus, warehouseLocation).length
            },
            shipments: {
                inTransit: this.filterShipments(shipmentStatus === 'picked-up' ? 'in-transit' : shipmentStatus, shipmentCarrier).filter(u => u.shipmentStatus === SHIPMENT_STATUS.IN_TRANSIT).length,
                scheduling: this.filterShipments(shipmentStatus, shipmentCarrier).filter(u => u.shipmentStatus === SHIPMENT_STATUS.SCHEDULING).length,
                delivered: shipmentStatus === 'history' ? this.filterShipments('history', shipmentCarrier).length : DATA.summary.delivered,
                total: this.filterShipments(shipmentStatus, shipmentCarrier).length
            },
            warranty: {
                active: this.filterWarranty(warrantyStatus, warrantyService).filter(u => u.warrantyStatus === WARRANTY_STATUS.ACTIVE).length,
                requests: DATA.summary.warrantyRequests,
                scheduled: DATA.summary.serviceScheduled,
                inScheduling: DATA.summary.serviceInScheduling,
                total: this.filterWarranty(warrantyStatus, warrantyService).length
            }
        };
    }
};

// ============================================================================
// TABLE RENDERING FUNCTIONS
// ============================================================================
const RENDER = {
    // Render warehouse table
    warehouseTable: function(units, limit = 50) {
        const displayUnits = units.slice(0, limit);
        return displayUnits.map(unit => ({
            location: unit.locationName || 'Pending',
            sku: unit.sku,
            productName: unit.productName,
            serialNumber: unit.serialNumber,
            status: unit.warehouseStatus
        }));
    },

    // Render shipments table
    shipmentsTable: function(units, limit = 50) {
        const displayUnits = units.slice(0, limit);
        return displayUnits.map(unit => ({
            serialNumber: unit.serialNumber,
            sku: unit.sku,
            client: unit.client,
            destination: unit.destination,
            carrier: unit.carrier,
            trackingNumber: unit.trackingNumber,
            status: unit.shipmentStatus,
            statusDisplay: unit.shipmentStatus === 'in-transit' ? 'In Transit' :
                          unit.shipmentStatus === 'scheduling' ? 'Scheduling' : 'Delivered'
        }));
    },

    // Render warranty table
    warrantyTable: function(units, limit = 50) {
        const displayUnits = units.slice(0, limit);
        return displayUnits.map(unit => ({
            serialNumber: unit.serialNumber,
            productName: unit.shortName || unit.productName,
            client: unit.client,
            deliveryDate: unit.deliveryDate,
            warrantyExpires: unit.warrantyExpires,
            warrantyStatus: unit.warrantyStatus,
            serviceStatus: unit.serviceStatus,
            serviceStatusDisplay: unit.serviceStatus === 'no-issues' ? 'No Issues' :
                                 unit.serviceStatus === 'requested' ? 'Requested' :
                                 unit.serviceStatus === 'in-scheduling' ? 'In Scheduling' :
                                 unit.serviceStatus === 'scheduled' ? 'Scheduled' : 'Completed'
        }));
    },

    // Generate HTML for warehouse table rows
    warehouseTableHTML: function(units, limit = 50) {
        const data = this.warehouseTable(units, limit);
        return data.map(row => `
            <tr data-status="${row.status}" data-location="${row.location.toLowerCase().includes('atlanta') ? 'atlanta' :
                                                            row.location.toLowerCase().includes('miami') ? 'miami' :
                                                            row.location.toLowerCase().includes('houston') ? 'houston' :
                                                            row.location.toLowerCase().includes('phoenix') ? 'phoenix' :
                                                            row.location.toLowerCase().includes('los angeles') ? 'los-angeles' :
                                                            row.location.toLowerCase().includes('charlotte') ? 'charlotte' : 'pending'}">
                <td><strong>${row.location}</strong></td>
                <td>${row.sku}</td>
                <td>${row.productName}</td>
                <td>${row.serialNumber}</td>
            </tr>
        `).join('');
    },

    // Generate HTML for shipments table rows
    shipmentsTableHTML: function(units, limit = 50) {
        const data = this.shipmentsTable(units, limit);
        return data.map(row => `
            <tr data-status="${row.status}" data-carrier="${row.carrier.toLowerCase().includes('first') ? 'first-track' :
                                                           row.carrier.toLowerCase().includes('fedex') ? 'fedex' :
                                                           row.carrier.toLowerCase().includes('ups') ? 'ups' : 'xpo'}">
                <td><strong>${row.serialNumber}</strong></td>
                <td>${row.sku}</td>
                <td>${row.client}</td>
                <td>${row.destination}</td>
                <td>${row.carrier}</td>
                <td>${row.trackingNumber}</td>
                <td><span class="status-badge ${row.status}">${row.statusDisplay}</span></td>
            </tr>
        `).join('');
    },

    // Generate HTML for warranty table rows
    warrantyTableHTML: function(units, limit = 50) {
        const data = this.warrantyTable(units, limit);
        return data.map(row => `
            <tr data-warranty-status="${row.warrantyStatus}" data-service-status="${row.serviceStatus}">
                <td><strong>${row.serialNumber}</strong></td>
                <td>${row.productName}</td>
                <td>${row.client}</td>
                <td>${row.deliveryDate}</td>
                <td>${row.warrantyExpires}</td>
                <td><span class="status-badge ${row.warrantyStatus}">${row.warrantyStatus === 'active' ? 'Active' : 'Expired'}</span></td>
                <td><span class="status-badge ${row.serviceStatus === 'no-issues' ? 'in-stock' :
                                                row.serviceStatus === 'requested' ? 'requested' :
                                                row.serviceStatus === 'in-scheduling' ? 'pending' : 'scheduled'}">${row.serviceStatusDisplay}</span></td>
            </tr>
        `).join('');
    }
};

// ============================================================================
// DASHBOARD UPDATE FUNCTIONS
// ============================================================================
const DASHBOARD = {
    currentFilters: {
        warehouse: { status: 'all', location: 'all' },
        shipments: { status: 'all', carrier: 'all' },
        warranty: { status: 'all', service: 'all' }
    },

    // Update warehouse filter
    setWarehouseFilter: function(status, location) {
        this.currentFilters.warehouse.status = status || 'all';
        this.currentFilters.warehouse.location = location || 'all';
        this.updateDashboard();
    },

    // Update shipments filter
    setShipmentsFilter: function(status, carrier) {
        this.currentFilters.shipments.status = status || 'all';
        this.currentFilters.shipments.carrier = carrier || 'all';
        this.updateDashboard();
    },

    // Update warranty filter
    setWarrantyFilter: function(status, service) {
        this.currentFilters.warranty.status = status || 'all';
        this.currentFilters.warranty.service = service || 'all';
        this.updateDashboard();
    },

    // Clear all filters
    clearFilters: function() {
        this.currentFilters = {
            warehouse: { status: 'all', location: 'all' },
            shipments: { status: 'all', carrier: 'all' },
            warranty: { status: 'all', service: 'all' }
        };
        this.updateDashboard();
    },

    // Get current filtered data
    getFilteredData: function() {
        return {
            warehouse: FILTERS.filterWarehouse(
                this.currentFilters.warehouse.status,
                this.currentFilters.warehouse.location
            ),
            shipments: FILTERS.filterShipments(
                this.currentFilters.shipments.status,
                this.currentFilters.shipments.carrier
            ),
            warranty: FILTERS.filterWarranty(
                this.currentFilters.warranty.status,
                this.currentFilters.warranty.service
            )
        };
    },

    // Update dashboard with current filters
    updateDashboard: function() {
        const filtered = this.getFilteredData();
        const counts = FILTERS.getCounts(
            this.currentFilters.warehouse.status,
            this.currentFilters.warehouse.location,
            this.currentFilters.shipments.status,
            this.currentFilters.shipments.carrier,
            this.currentFilters.warranty.status,
            this.currentFilters.warranty.service
        );

        // Return data for UI update
        return {
            filtered,
            counts,
            tables: {
                warehouse: RENDER.warehouseTableHTML(filtered.warehouse),
                shipments: RENDER.shipmentsTableHTML(filtered.shipments),
                warranty: RENDER.warrantyTableHTML(filtered.warranty)
            }
        };
    }
};

// ============================================================================
// CONSOLE LOG FOR VERIFICATION
// ============================================================================
console.log('Saint James Cooler Portfolio Data Loaded');
console.log('Total Units:', DATA.summary.totalUnits);
console.log('Pending Arrival:', DATA.summary.pendingArrival);
console.log('Active Inventory:', DATA.summary.activeInventory);
console.log('Exited Warehouse:', DATA.summary.exitedWarehouse);
console.log('In Transit:', DATA.shipments.inTransit.length);
console.log('Scheduling:', DATA.shipments.scheduling.length);
console.log('Delivered (Recent):', DATA.shipments.delivered.length);
console.log('Warranty Records:', DATA.warranty.all.length);
console.log('Service Requests:', DATA.warranty.withServiceRequests.length);

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DATA, FILTERS, RENDER, DASHBOARD, PRODUCTS, LOCATIONS, CARRIERS, CLIENTS };
}
