# Authentication & Subscription Architecture

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User Signs Up
   ↓
auth.users (Supabase Auth)
   ↓ [TRIGGER: on_auth_user_created]
public.subscriptions (tier: 'free', status: 'active')
   ↓
Frontend Zustand Store
   ↓
localStorage (persist)


2. User Makes Payment
   ↓
Payment Service (Iyzico)
   ↓
subscriptionService.upgradeSubscription()
   ↓
public.subscriptions (tier: 'premium'/'pro', end_date: +1month/+1year)
   ↓
auth.users.raw_user_meta_data.subscription_tier (sync)
   ↓
Frontend State Update (real-time)


3. User Logs Out
   ↓
authService.signOut()
   ↓
localStorage.clear() + sessionStorage.clear()
   ↓
Zustand state reset
   ↓
Redirect to homepage


4. User Deleted (Admin Action)
   ↓
DELETE FROM auth.users
   ↓ [TRIGGER: on_auth_user_deleted]
DELETE FROM public.subscriptions (CASCADE)
   ↓
DELETE FROM public.invitations (CASCADE)
   ↓
DELETE FROM public.media (CASCADE)
   ↓
Frontend validation (30s interval) → Force logout
```

## 🗄️ Database Tables

### 1. `auth.users` (Managed by Supabase)
```sql
- id (uuid, PK)
- email (text)
- created_at (timestamp)
- raw_user_meta_data (jsonb)
  ↳ full_name
  ↳ phone
  ↳ subscription_tier (synced from subscriptions table)
```

### 2. `public.subscriptions` (Application Data)
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id, UNIQUE)
- tier ('free' | 'pro' | 'premium')
- status ('active' | 'cancelled' | 'expired')
- start_date (timestamp)
- end_date (timestamp, nullable)
- cancelled_at (timestamp, nullable)
- invitations_created_this_month (int, default: 0)
- invitations_created_lifetime (int, default: 0)
- storage_used_mb (decimal, default: 0)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🔄 Triggers

### `on_auth_user_created`
**When:** User signs up
**Action:** Automatically create free subscription

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### `on_auth_user_deleted`
**When:** User is deleted (admin action)
**Action:** Cascade delete all user data

```sql
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();
```

## 💾 Storage Management

### localStorage
- **Key:** `auth-store`
- **Content:** `{ user, session, isInitialized }`
- **Cleared on:**
  - Manual logout
  - Session validation failure
  - User deleted

### sessionStorage
- **Content:** Temporary session data (e.g., pending payments)
- **Cleared on:**
  - Manual logout
  - Session validation failure
  - User deleted

## 🔐 Session Validation

Frontend validates session **every 30 seconds**:

1. Check if user exists in `auth.users` → `supabase.auth.getUser()`
2. Check if subscription exists → `authService.getCurrentUser()`
3. If either fails → Force logout + Clear storage

## 📱 Frontend State (Zustand)

```typescript
interface AuthState {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signUp: (data) => Promise<void>
  signIn: (data) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (user) => void
}
```

## 🔄 Real-Time Subscription Updates

**After successful payment:**
1. Update `subscriptions` table
2. Update `auth.users` metadata (optional sync)
3. Dispatch `subscription-updated` event
4. All `useSubscription` hooks refresh automatically
5. UI updates without page reload

## ⚠️ Important Notes

1. **Primary Source of Truth:** `auth.users` (Supabase Auth)
2. **Application Data:** `public.subscriptions` (synced via triggers)
3. **Never trust localStorage alone** - always validate with backend
4. **Logout clears ALL storage** - no orphaned data
5. **Triggers ensure consistency** - no manual sync needed

## 🧪 Testing Checklist

- [ ] New user signup → Free subscription created automatically
- [ ] Payment success → Subscription upgraded in real-time
- [ ] Logout → All storage cleared
- [ ] User deleted (admin) → Auto logout within 30s
- [ ] Network error → State preserved (don't clear storage)
- [ ] Session expired → Force logout + Clear storage

