# Task 4: Enhance and fix Rider and Vendor experience tabs

**Agent**: Task 4 Agent
**Status**: Completed

## Summary of Changes

### Rider Components

#### 1. RiderDashboard.tsx
- Added `riderCurrentDelivery` and `setActiveModal` from store
- Active delivery now resolved from `riderCurrentDelivery` store value (falls back to first active delivery)
- Added `Package` icon import
- `handleAccept` now calls `setRiderCurrentDelivery(id)` to persist accepted delivery to store
- **New**: Added "New Delivery Request" CTA card that opens `NewDeliveryRequestModal` via `setActiveModal('new-delivery')` — only shown when rider is online and has no current delivery

#### 2. RiderEarningsHub.tsx
- **Replaced custom CSS bar chart with recharts** (`BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`, `Cell`)
- Added `HourlyTooltip` custom tooltip component with Iftar bonus indicator
- Chart data now includes `isIftar` flag for conditional cell coloring (gold vs green)
- Y-axis formatted as `₦XK`, X-axis shows hour labels
- Maintains existing visual design with dark theme integration

#### 3. RiderDeliveryMap.tsx
- Now reads `riderCurrentDelivery` from store to determine active delivery
- Resolves delivery info from `riderActiveDeliveries` matching store ID
- Finds pickup address from `riderDeliveryRequests` if available
- **Added empty state**: When no active delivery and no current delivery, shows centered "No Active Delivery" message with contextual guidance (online vs offline)
- **Added pickup marker** (green Package pin) on the map with "Pickup" label
- **Added destination marker** (gold MapPin) with "Drop-off" label
- Bottom sheet now shows delivery info from store (`activeDelivery.address`, `activeDelivery.customer`, etc.)
- **Added "View Available Deliveries" button** in empty state when rider is online
- Fixed ticker to show actual `activeDelivery.items`

#### 4. RiderProfileTab.tsx
- Added `BarChart3` icon import
- **Added "Performance Hub" menu item** that opens `setActiveModal('rider-performance')`
- **Added "View All" button** in Performance section header that opens RiderPerformanceHub modal
- Performance section header now has flex layout with right-aligned "View All" link

### Vendor Components

#### 5. VendorDashboard.tsx
- **Added `IftarCountdown` component** with live second-by-second countdown timer (MM:SS format)
- **Added `IftarCountdownBanner` component** — global countdown banner showing time until Iftar with urgency state (red when ≤15 min)
- Iftar badges on order cards now use live `IftarCountdown` instead of static text
- **Added "Reject" button** (red X icon) alongside Accept button — calls `handleRejectOrder` with destructive toast
- Accept button handler now includes customer name in description
- Reject toast uses `variant: 'destructive'`

#### 6. VendorStoreTab.tsx
- **Added `useAppStore` import** and `setActiveModal` access
- **Added quick stats row**: Menu Items count, Available count, Total Orders
- **Added Stock Control link** in section header → `setActiveModal('vendor-stock')`
- **Added Add Item form** with name, price, category inputs (expands on FAB click)
- **Added `handleAddItem` function** with validation and state update
- FAB now toggles add form instead of showing a toast
- **Enhanced item stats**: Each item now shows orders count, revenue (`price × orders`), and rank badge (#1, #2 = "Top #N")
- **Added visibility indicator** (Eye icon) for available items
- Items are ranked by orders count with gold "Top #N" badge for top 2

#### 7. VendorWallet.tsx
- **Added `setActiveModal` from store** and `AnimatePresence` from framer-motion
- **Added "Sales Insights" button** on balance card → `setActiveModal('vendor-insights')`
- **Added withdraw confirmation bottom sheet** with:
  - Amount input field
  - Quick percentage buttons (25%, 50%, 75%, 100%)
  - Bank account display
  - Cancel/Confirm buttons
  - Input validation (empty, invalid, exceeds balance)
- **Added `showWithdrawConfirm` and `withdrawAmount` state**
- Withdraw button on balance card now opens confirmation instead of direct toast

#### 8. VendorProfileTab.tsx
- **Added `vendorSalesInsights` import** from `@/lib/data`
- **Performance Highlights now uses dynamic data** from `vendorSalesInsights` instead of hardcoded values
- **Added "View Full Insights" button** → `setActiveModal('vendor-insights')`
- Top selling item, peak hour, customer retention, and avg order value all sourced from `vendorSalesInsights`

## Lint Status
- All 8 modified files pass ESLint with 0 errors, 0 warnings
- Pre-existing error in CartTab.tsx (not touched by this task)

## Data Flow Connections
- `riderCurrentDelivery` → RiderDashboard, RiderDeliveryMap (store-based active delivery tracking)
- `setActiveModal('new-delivery')` → RiderDashboard CTA button
- `setActiveModal('rider-performance')` → RiderProfileTab menu item + section button
- `setActiveModal('vendor-insights')` → VendorWallet, VendorProfileTab, VendorDashboard
- `setActiveModal('vendor-stock')` → VendorStoreTab header link
- `vendorSalesInsights` → VendorProfileTab performance highlights
