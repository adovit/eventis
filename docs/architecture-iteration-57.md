# Architecture Design — Iteration 5.7: Auth UX Overhaul & User Profile

**Date**: 2026-03-01
**Status**: Approved
**Scope**: Navbar, Google OAuth, Profile page, IBAN storage, Auth gates

---

## Security Finding (overrides PRD)

⚠️ **SECURITY — IBAN must NOT go in `profiles` table.**

`profiles` has `FOR SELECT USING (true)` — any anonymous Supabase query can read all columns. Supabase RLS cannot restrict individual columns. Adding `iban` to `profiles` would expose every user's bank account number to unauthenticated API requests.

**Resolution**: New `payout_info` table with owner-only RLS. See ADR-007. Migration: `012_payout_info.sql` (written).

---

## Data Flow Diagrams

### Google OAuth Flow
```
User clicks "Sign in with Google" on /login?returnUrl=/events/slug
  → supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: '${origin}/login?returnUrl=${encoded}' }
    })
  → Browser → Google OAuth consent
  → Google → Supabase OAuth endpoint (code exchange, PKCE)
  → Supabase → redirectTo URL: /login?returnUrl=/events/slug
  → Login.tsx mounts, useEffect calls getSession() → session exists
  → navigate(returnUrl || '/')
```

### Auth Gate Flow (buy button)
```
Unauthenticated user clicks "Pirkti" on /events/zalgiris-..
  → handleBuy() checks: if (!user) navigate('/login?returnUrl=/events/zalgiris-..')
  → User logs in (email or Google)
  → Login.tsx redirects to /events/zalgiris-..
  → EventDetail loads, user clicks "Pirkti" again → Stripe Checkout
```

### IBAN Save Flow
```
User on /profile, enters "LT123456789012345678", clicks "Išsaugoti"
  → Client validates: /^LT\d{18}$/ ✓
  → supabase.from('payout_info').upsert({ id: user.id, iban, updated_at: new Date() })
  → RLS: id = auth.uid() ✓ → write succeeds
  → Profile shows masked IBAN: "LT12 **** **** **** ****"
```

---

## Files to Create

### 1. `supabase/migrations/012_payout_info.sql` ✅ (written)
Creates `payout_info` table + owner-only RLS + profiles user self-write policies.

### 2. `src/pages/Profile.tsx` (new)
Route: `/profile` (inside ProtectedRoute)

**Fetches:**
```ts
// Profile (verification status)
supabase.from('profiles').select('verified, verified_at').eq('id', user.id).maybeSingle()

// IBAN
supabase.from('payout_info').select('iban, updated_at').eq('id', user.id).maybeSingle()

// Summary stats (P1)
supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('seller_id', user.id)
supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id)
```

**IBAN upsert:**
```ts
supabase.from('payout_info').upsert(
  { id: user.id, iban: ibanValue.toUpperCase(), updated_at: new Date().toISOString() },
  { onConflict: 'id' }
)
```

**IBAN validation:**
```ts
const IBAN_REGEX = /^LT\d{18}$/
// Normalise: strip spaces, uppercase before validate
```

**IBAN mask display:**
```ts
// "LT12345678901234567890" → "LT12 **** **** **** ****"
function maskIban(iban: string): string {
  return iban.slice(0, 4) + ' **** **** **** ' + '*'.repeat(4)
}
```

**Sections on page:**
1. Account info card: email, member since (`user.created_at` formatted `lt-LT`)
2. Verification card: green badge (Patvirtintas) or yellow badge + link to /verify (Nepatvirtintas)
3. Payout card: IBAN input with save button; masked display when saved; "Keisti" button to re-edit

---

## Files to Modify

### 3. `src/components/Layout.tsx`

**Current**: Flat link list — 6+ text links for logged-in users.
**New**: Avatar circle + dropdown, or auth buttons when logged out.

**State added:**
```ts
const [open, setOpen] = useState(false)
const menuRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

**Avatar:**
```tsx
const initial = user.email?.[0].toUpperCase() ?? '?'
// Circular div, indigo background, white text initial
```

**Dropdown items (logged in):**
- Profilis → `/profile`
- Mano skelbimai → `/my-listings`
- Mano užsakymai → `/my-orders`
- Mano pajamos → `/my-earnings`
- [divider — admin only] Išmokos / Skelbimai / Vartotojai
- [divider — unverified only] Patvirtinti tapatybę (yellow)
- Atsijungti (red text, bottom)

**Logged out:**
- "Prisijungti" text link + "Registruotis" filled button (same as today, unchanged)

---

### 4. `src/components/ProtectedRoute.tsx`

**Change**: Pass current path as `returnUrl` on redirect.

```tsx
import { useLocation } from 'react-router-dom'
// ...
const location = useLocation()
const returnUrl = encodeURIComponent(location.pathname + location.search)
return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
```

---

### 5. `src/pages/Login.tsx`

**Changes:**
1. Add `useSearchParams` to read `returnUrl`
2. Add `useEffect` to detect existing session on mount (post-OAuth return)
3. Add Google OAuth button
4. Change post-login navigate target from `/my-listings` to `returnUrl || '/'`

```tsx
// SECURITY: sanitise returnUrl — must be a relative path (starts with /)
// Prevents open redirect: /login?returnUrl=https://evil.com
function safeReturnUrl(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/')) return '/'
  return raw
}

// Detect existing session (post-OAuth return)
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) navigate(safeReturnUrl(returnUrl), { replace: true })
  })
}, [])

// Google OAuth handler
async function handleGoogle() {
  const safe = safeReturnUrl(searchParams.get('returnUrl'))
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/login?returnUrl=${encodeURIComponent(safe)}`,
    },
  })
}
```

**UI addition**: Below the form, "arba" divider + Google button (white bg, border, Google logo as SVG inline or text "G").

---

### 6. `src/pages/Register.tsx`

**Changes:**
1. Add Google OAuth button (same handler as Login)
2. After successful email signup with session: navigate to `returnUrl || '/'` instead of `/my-listings`

---

### 7. `src/pages/EventDetail.tsx`

**Change**: Line 124 — standardize `?next=` → `?returnUrl=`.

```tsx
// Before:
navigate(`/login?next=/events/${slug}`)
// After:
navigate(`/login?returnUrl=${encodeURIComponent(`/events/${slug}`)}`)
```

---

### 8. `src/main.tsx`

**Change**: Add `Profile` import and route inside ProtectedRoute.

```tsx
import Profile from './pages/Profile'
// Inside ProtectedRoute children:
{ path: '/profile', element: <Profile /> },
```

---

### 9. `src/pages/MyEarnings.tsx` (P1)

**Change**: If no `payout_info` row exists for user, show a banner:
> "Norėdami gauti išmokas, įveskite savo IBAN paskyroje → Profilis"

Fetch `payout_info` on mount. If result is null/no iban, show banner with link to `/profile`.

---

## RLS Summary for Iteration 5.7

| Table | Policy | Who |
|-------|--------|-----|
| `profiles` | public SELECT | anon + authenticated |
| `profiles` | owner INSERT | `id = auth.uid()` |
| `profiles` | owner UPDATE | `id = auth.uid()` |
| `profiles` | service_role all | Edge Functions |
| `payout_info` | owner SELECT | `id = auth.uid()` |
| `payout_info` | owner INSERT | `id = auth.uid()` |
| `payout_info` | owner UPDATE | `id = auth.uid()` |

---

## External Config (pre-dev, manual step)

1. **Google Console**: Create OAuth 2.0 client ID
   - Authorized redirect URI: `https://<supabase-project>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard**: Auth → Providers → Google
   - Paste Client ID and Client Secret
   - Enable provider
3. **Supabase Dashboard**: Auth → URL Configuration
   - Add `http://localhost:5173` to "Redirect URLs" (dev)
   - Add production domain to "Redirect URLs" when deploying

No new environment variables needed in `.env` — Supabase handles OAuth credentials server-side.

---

## No New Edge Functions Required

Google OAuth: handled entirely by Supabase Auth built-in.
IBAN save: direct Supabase client call from frontend (new RLS allows it).
Profile read: direct Supabase client call (anon key + RLS).

---

## Implementation Order (for `/create-plan`)

1. Apply migration `012_payout_info.sql` in Supabase
2. `ProtectedRoute.tsx` — add returnUrl (smallest, unblocks all auth gate tests)
3. `Login.tsx` — returnUrl reading + post-OAuth session detection + Google button
4. `Register.tsx` — Google button
5. `EventDetail.tsx` — fix `?next=` → `?returnUrl=`
6. `Layout.tsx` — avatar + dropdown (replaces flat nav)
7. `src/pages/Profile.tsx` — new page
8. `src/main.tsx` — add `/profile` route
9. `MyEarnings.tsx` — IBAN prompt banner (P1, can be last)
