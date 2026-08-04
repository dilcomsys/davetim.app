# 📊 Analytics Dashboard Features

## 🎯 Quick Reference

### StatsCard Component
```typescript
<StatsCard
  title="Toplam Görüntüleme"
  value={totalViews}
  subtitle="Son 30 gün"
  icon={Eye}
  iconColor="blue"
  trend={{ value: 15, isPositive: true }}
/>
```

**Props:**
- `title`: string
- `value`: string | number
- `subtitle?`: string
- `icon`: LucideIcon
- `iconColor`: 'primary' | 'blue' | 'green' | 'purple' | 'yellow' | 'red'
- `trend?`: { value: number, isPositive: boolean }

---

### RSVPChart Component
```typescript
<RSVPChart
  attending={50}
  notAttending={10}
  pending={20}
/>
```

**Features:**
- SVG donut chart
- 3 categories with color coding
- Percentage breakdown
- Total in center
- Legend with counts

---

### ViewsTimeline Component
```typescript
<ViewsTimeline
  data={[
    { date: '2025-10-05', views: 10 },
    { date: '2025-10-06', views: 15 },
    // ... 7 days
  ]}
  totalViews={100}
/>
```

**Features:**
- Horizontal bar chart
- Last 7 days
- Daily breakdown
- Average calculation
- Trend insights

---

### RecentActivity Component
```typescript
<RecentActivity
  activities={[
    {
      id: '1',
      type: 'invitation_created',
      title: 'Yeni davetiye oluşturuldu',
      description: 'Düğün Davetiyesi',
      timestamp: '2025-10-11T10:00:00Z',
      invitationTitle: 'Düğün Davetiyesi'
    }
  ]}
/>
```

**Activity Types:**
- `view` - 👁️ Görüntülenme
- `rsvp_yes` - ✅ RSVP Evet
- `rsvp_no` - ❌ RSVP Hayır
- `guest_added` - 👥 Davetli Eklendi
- `invitation_created` - 📅 Davetiye Oluşturuldu

---

### TopTemplates Component
```typescript
<TopTemplates
  templates={[
    {
      templateId: '1',
      templateName: 'Modern Mavi',
      previewImage: 'https://...',
      usageCount: 5,
      averageViews: 20,
      tier: 'pro'
    }
  ]}
/>
```

**Features:**
- Top 5 templates
- Ranked with medals (🥇🥈🥉)
- Preview image
- Tier badge
- Usage stats

---

### ExportAnalytics Component
```typescript
<ExportAnalytics
  data={{
    invitations: [...],
    guestStats: {...},
    activities: [...]
  }}
/>
```

**Export Formats:**
1. **CSV:**
   - Excel-compatible
   - Full data export
   - Auto-download
   - Timestamped filename

2. **PDF:**
   - HTML report
   - Summary stats
   - Detailed table
   - Print-optimized
   - New window

---

## 🎨 Color System

```typescript
const colorClasses = {
  primary: 'bg-primary-100 text-primary-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
};
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
.grid-cols-1          /* < 768px */
.md:grid-cols-2       /* 768px+ */
.lg:grid-cols-5       /* 1024px+ */

/* Analytics Grids */
.grid-cols-1          /* Mobile: Stack */
.lg:grid-cols-2       /* Desktop: Side-by-side */
```

---

## 🚀 Usage Example

```tsx
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RSVPChart } from '../components/Dashboard/RSVPChart';
import { Eye, Users } from 'lucide-react';

function MyDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatsCard
        title="Total Views"
        value={1234}
        icon={Eye}
        iconColor="blue"
      />
      
      <StatsCard
        title="Total Guests"
        value={56}
        subtitle="Across all invitations"
        icon={Users}
        iconColor="purple"
        trend={{ value: 12, isPositive: true }}
      />
    </div>
  );
}
```

---

## 🎯 Empty States

All components have empty states:
- Friendly icons
- Helpful messages
- Call-to-action hints

```tsx
// Example: No data
<div className="text-center text-gray-400">
  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
  <p>Henüz görüntüleme verisi yok</p>
</div>
```

---

## ✨ Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* Usage */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

---

## 🎓 Best Practices

1. **Data Validation:** Always check for empty/null data
2. **Error Boundaries:** Wrap charts in error boundaries
3. **Loading States:** Show skeleton loaders
4. **Accessibility:** Use semantic HTML, ARIA labels
5. **Performance:** Memoize expensive calculations
6. **Responsiveness:** Test on all screen sizes
7. **Empty States:** Provide helpful messages

---

## 📊 Data Structure

### GuestStats Interface
```typescript
interface GuestStats {
  total: number;
  pending: number;
  attending: number;
  declined: number;
  total_companions: number;
  total_attending: number;
}
```

### Activity Interface
```typescript
interface Activity {
  id: string;
  type: 'view' | 'rsvp_yes' | 'rsvp_no' | 'guest_added' | 'invitation_created';
  title: string;
  description: string;
  timestamp: string;
  invitationTitle?: string;
}
```

### TemplateUsage Interface
```typescript
interface TemplateUsage {
  templateId: string;
  templateName: string;
  previewImage?: string;
  usageCount: number;
  averageViews: number;
  tier: 'free' | 'pro' | 'premium';
}
```

---

## 🔧 Customization

### Changing Colors
Edit `colorClasses` in `StatsCard.tsx`:
```typescript
const colorClasses = {
  primary: 'bg-primary-100 text-primary-600',
  // Add your custom color
  custom: 'bg-custom-100 text-custom-600',
};
```

### Changing Chart Styles
Edit SVG properties in `RSVPChart.tsx`:
```typescript
<circle
  stroke="#10b981"  // Change color
  strokeWidth="20"  // Change thickness
/>
```

### Changing Timeline Length
Edit `ViewsTimeline.tsx`:
```typescript
// Change from 7 to 30 days
for (let i = 29; i >= 0; i--) {
  // ...
}
```

---

**All components are fully typed, responsive, and production-ready! 🚀**

