# Quick Start Guide - Mouchak Dashboard

## 🚀 Getting Started

1. **Navigate to Dashboard**
   ```
   http://localhost:3000/staff-dashboard/dashboard
   ```

2. **Dashboard layout**
   - **Desktop/Tablet**: Left sidebar navigation + main content area
   - **Mobile**: Bottom navigation bar + hamburger menu for sidebar

## 📱 Responsive Behavior

### Mobile (< 768px)
- Bottom navigation with 5 main sections
- Hamburger menu for sidebar
- Single column layouts
- Full-screen modals slide from bottom
- Compact spacing and smaller fonts

### Tablet (768px - 1023px)
- Grid layouts adapt to 2 columns where possible
- Sidebar visible
- Larger touch targets
- Optimized table scrolling

### Desktop (≥ 1024px)
- Full sidebar navigation
- Multi-column layouts
- All features visible
- Horizontal table scrolling

## 🎨 Customizing Colors

### Global Colors
Edit `theme.ts`:

```typescript
const Theme = {
  primary: '#f01172',      // Main brand color
  primaryDark: '#c20d5e',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  // ...
};
```

### Component-Specific
Pass custom colors to components:

```typescript
<KpiCard
  icon="💰"
  accent="#fff0f6"  // Pink background
/>

<Btn style={{ background: '#custom-color' }} />
```

## 📊 Adding Charts

Charts use **Recharts**. Example:

```typescript
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={data}>
    <Area type="monotone" dataKey="value" stroke={Theme.primary} />
  </AreaChart>
</ResponsiveContainer>
```

## 🔧 Modifying Navigation

### Add New Menu Item
Edit `constants.ts`:

```typescript
export const NAV = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'mypage', label: 'My Page', icon: '🎯' },  // Add this
];
```

### Create New View
`components/views/MyPageView.tsx`:

```typescript
export default function MyPageView() {
  const { isMobile } = useResponsive();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1>My Page</h1>
        {/* Your content */}
      </div>
    </div>
  );
}
```

### Add to Layout
Edit `components/DashboardLayout.tsx`:

```typescript
const views = {
  overview: <OverviewView ... />,
  mypage: <MyPageView />,  // Add this
};
```

## 🎯 Common Tasks

### Change Primary Color
```typescript
// theme.ts
primary: '#your-color',
primaryDark: '#darker-shade',
secondary: '#light-shade',
```

### Add Table
```typescript
<table style={{ width: '100%' }}>
  <thead>
    <tr>
      <Th>Column Name</Th>
    </tr>
  </thead>
  <tbody>
    {data.map(row => (
      <tr key={row.id}>
        <Td>{row.name}</Td>
      </tr>
    ))}
  </tbody>
</table>
```

### Add Modal
```typescript
{showModal && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Card>{/* Modal content */}</Card>
  </div>
)}
```

### Add Form Inputs
```typescript
<div>
  <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
    Label
  </label>
  <input
    type="text"
    style={{
      width: '100%',
      padding: '10px 14px',
      border: `1px solid ${Theme.border}`,
      borderRadius: 8,
      fontSize: 13,
    }}
  />
</div>
```

## 📈 Data Integration

### Replace Mock Data
Current: `data/mockData.ts` (static)

Replace with API calls:

```typescript
// page.tsx
useEffect(() => {
  fetch('/api/products')
    .then(res => res.json())
    .then(data => setProducts(data));
}, []);
```

### Real-time Updates
```typescript
const [products, setProducts] = useState([]);

useEffect(() => {
  // WebSocket connection
  const ws = new WebSocket('wss://your-api.com');
  ws.onmessage = (e) => {
    setProducts(JSON.parse(e.data));
  };
  return () => ws.close();
}, []);
```

## 🎓 Learning Resources

### Component Structure
- `Primitives.tsx` - Basic UI components
- `DashboardLayout.tsx` - Main layout & routing
- `views/` - Page-specific components

### Styling Approach
- **Inline styles** via React CSSProperties
- **Theme tokens** from `theme.ts`
- **Responsive** using `useResponsive()` hook

### Responsive Pattern
```typescript
const { isMobile } = useResponsive();

// Use in JSX conditionally
{isMobile ? <MobileLayout /> : <DesktopLayout />}

// Or with styles
padding: isMobile ? '12px' : '24px'
```

## 🐛 Debugging

### Check Responsive State
```typescript
const { isMobile, isTablet, width } = useResponsive();
console.log(`Mobile: ${isMobile}, Width: ${width}`);
```

### Inspect Component Props
React DevTools → Select component → View props in console

### Test Responsive
Chrome DevTools → Toggle device toolbar (F12) → Choose device

## 📊 Dashboard Sections Reference

| Section | File | Purpose |
|---------|------|---------|
| Overview | OverviewView.tsx | KPIs, charts, recent orders |
| E-Commerce | EcommerceView.tsx | Orders, products, customers |
| Inventory | InventoryView.tsx | Stock levels, manual sales |
| Analytics | AnalyticsView.tsx | Revenue trends, metrics |
| Branches | BranchesView.tsx | Multi-branch management |
| Settings | SettingsView.tsx | Store configuration |

## 🚀 Performance Tips

1. **Lazy Load Views** - Use React.lazy() for large views
2. **Memoize Components** - Prevent unnecessary re-renders
3. **Optimize Charts** - Limit data points, debounce updates
4. **Image Optimization** - Use Next.js Image component

## 📚 Next Steps

1. Replace mock data with real API
2. Add authentication/authorization
3. Implement data refresh logic
4. Add export functionality (PDF, CSV)
5. Create custom reports
6. Add real-time notifications

---

For detailed documentation, see [README.md](./README.md)
