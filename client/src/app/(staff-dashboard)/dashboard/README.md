# Mouchak Cosmetics - Responsive Admin Dashboard

A fully responsive admin dashboard built with Next.js, React, and TypeScript for managing an e-commerce cosmetics store.

## Features

✅ **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
✅ **Multiple Sections**:
  - Overview (KPIs, Revenue Trends, Category Mix, Recent Orders, Stock Alerts)
  - E-Commerce (Orders, Products, Customers)
  - Inventory (Stock Management, Manual Sales, Branch Tracking)
  - Analytics (Revenue Charts, Daily Sales, Top Products)
  - Branch Management (Multi-branch Support)
  - Settings (Store Configuration, Payment, Shipping, Staff, etc.)
  - POS (Placeholder for future Point of Sale)

✅ **Data Visualization** - Charts powered by Recharts
✅ **State Management** - React hooks for efficient state handling
✅ **Dark-aware Color Scheme** - Professional cosmetics brand colors

## File Structure

```
dashboard/
├── page.tsx                           # Main entry point
├── theme.ts                          # Design tokens & color palette
├── constants.ts                      # Navigation & settings config
├── hooks/
│   └── useBreakpoint.ts             # Responsive breakpoint hook
├── data/
│   └── mockData.ts                  # Mock data for development
├── components/
│   ├── DashboardLayout.tsx          # Main layout with sidebar & routing
│   ├── Primitives.tsx               # Reusable UI components (Card, Button, Badge, etc.)
│   ├── Table.tsx                    # Table utilities
│   └── views/
│       ├── OverviewView.tsx         # Dashboard overview
│       ├── EcommerceView.tsx        # Orders & products
│       ├── InventoryView.tsx        # Stock management
│       ├── AnalyticsView.tsx        # Charts & metrics
│       ├── BranchesView.tsx         # Branch management
│       └── SettingsView.tsx         # System settings
```

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: < 1024px
- **Desktop**: ≥ 1024px

Mobile uses bottom navigation, tablets and desktop use sidebar navigation.

## Installation & Setup

### 1. Install Dependencies

```bash
npm install recharts
```

### 2. Running the Dashboard

```bash
npm run dev
```

Navigate to: `http://localhost:3000/staff-dashboard/dashboard`

## Customization Guide

### 1. Change Brand Colors

Edit `theme.ts`:

```typescript
export const Theme = {
  primary: '#f01172',      // Main brand color
  primaryDark: '#c20d5e',  // Dark variant
  danger: '#ef4444',       // Error/destructive actions
  success: '#10b981',      // Success states
  // ... more colors
};
```

### 2. Modify Navigation Items

Edit `constants.ts`:

```typescript
export const NAV = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'custom', label: 'Custom Page', icon: '🎯' },
  // Add more nav items
];
```

### 3. Replace Mock Data

Update `data/mockData.ts` with real API calls:

```typescript
// Instead of static data, fetch from API
useEffect(() => {
  fetch('/api/products')
    .then(res => res.json())
    .then(data => setProducts(data));
}, []);
```

### 4. Add New Pages/Views

Create a new view file in `components/views/`:

```typescript
// components/views/CustomView.tsx
export default function CustomView() {
  return (
    <div>
      {/* Your content */}
    </div>
  );
}
```

Then add to `DashboardLayout.tsx`:

```typescript
const views = {
  // ... existing views
  custom: <CustomView />,
};
```

### 5. Adjust Responsive Breakpoints

Edit `hooks/useBreakpoint.ts`:

```typescript
return {
  isMobile: width < 768,    // Change breakpoint here
  isTablet: width < 1024,   // Or here
  width,
};
```

## Component Props

### KpiCard
```typescript
<KpiCard
  label="Monthly Revenue"
  value="৳3,12,000"
  delta={33.3}           // Optional: % change vs last period
  sub="subtitle text"    // Optional: additional text
  icon="💰"              // Emoji icon
  accent="#fff0f6"       // Background accent color
/>
```

### Btn
```typescript
<Btn
  variant="primary"      // 'primary' | 'secondary' | 'ghost' | 'danger'
  size="md"             // 'sm' | 'md'
  onClick={() => {}}
  disabled={false}
>
  Click Me
</Btn>
```

### Badge
```typescript
<Badge
  label="Active"
  bg="#dcfce7"
  color="#166534"
/>
```

### Card
```typescript
<Card pad={24}>
  {/* Content */}
</Card>
```

## Charts & Data Visualization

The dashboard uses **Recharts** for all visualizations:

```typescript
<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={revenueData}>
    <CartesianGrid strokeDasharray="3 3" stroke={Theme.border} />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Area type="monotone" dataKey="revenue" stroke={Theme.primary} />
  </AreaChart>
</ResponsiveContainer>
```

## Mobile Optimization

- Bottom navigation drawer on screens < 768px
- Collapse grid layouts to single column
- Hamburger menu toggle for sidebar
- Touch-friendly button sizes (44px+ recommended)
- Optimized modal positioning (slides from bottom on mobile)

## Performance Tips

1. **Code Splitting**: Each view is a separate component for optimal lazy loading
2. **Responsive Images**: Use `next/image` for optimized image loading
3. **Memoization**: Wrap expensive components with `React.memo()`
4. **State Management**: Use local state; consider Redux/Zustand for complex apps

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA standards
- Focus indicators on all inputs

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Real-time data updates with WebSocket
- [ ] Advanced filtering & search
- [ ] Export to PDF/CSV
- [ ] Dark mode toggle
- [ ] User preferences (sidebar collapse, theme, etc.)
- [ ] Real POS integration
- [ ] Multi-language support

## Support

For issues or questions about the dashboard, check:
1. Mock data structure in `data/mockData.ts`
2. Theme colors in `theme.ts`
3. Component props in `components/Primitives.tsx`
