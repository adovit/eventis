# BE QA Report — Iteration 5 Hardening (UI Modernisation + RLS Audit)
**Date**: 2026-03-01
**Tester**: BE QA
**Scope**: All 13 migrations (001–013) + stripe-webhook + create-checkout Edge Functions

---

## RLS Tests

| Table | Policy | Rule | Result | Notes |
|-------|--------|------|--------|-------|
| events | anon read events | `TO anon USING (true)` | ✅ Pass | |
| events | authenticated read events | `TO authenticated USING (true)` | ✅ Pass | Fixed correctly in 004 |
| tickets | anon read active | `TO anon USING (status='active')` | ✅ Pass | |
| tickets | authenticated buyer read active | — | ❌ **MISSING** | No policy — logged-in buyers see 0 tickets → BUG-BE-002 |
| tickets | sellers read own | `TO authenticated USING (seller_id=uid)` | ✅ Pass | |
| tickets | sellers insert own | `WITH CHECK (seller_id=uid)` | ✅ Pass | |
| tickets | sellers update own | `WITH CHECK (seller_id=uid AND status='cancelled')` | ✅ Pass | Correctly tightened in 003 |
| tickets | admin read all | `USING (is_admin=true)` | ✅ Pass | |
| tickets | admin update any | `USING + WITH CHECK (is_admin=true)` | ✅ Pass | |
| orders | buyers read own | `TO authenticated USING (buyer_id=uid)` | ✅ Pass | |
| orders | INSERT/UPDATE | None (Edge Fn uses service_role) | ✅ Pass | Correct design |
| payouts | sellers read own | `TO authenticated USING (seller_id=uid)` | ✅ Pass | |
| payouts | admin read all | `USING (is_admin=true)` | ✅ Pass | |
| payouts | admin update | `USING + WITH CHECK (is_admin=true)` | ✅ Pass | |
| payouts | INSERT | None (stripe-webhook uses service_role) | ✅ Pass | Correct design |
| profiles | public read | `USING (true)` (no TO clause = all roles) | ✅ Pass | Intentional for Verified badge |
| profiles | owner insert | `WITH CHECK (id=uid)` | ❌ **FAIL** | No verified=false constraint → BUG-BE-001 |
| payout_info | owner select | `USING (id=uid)` | ✅ Pass | IBAN correctly isolated from profiles |
| payout_info | owner insert | `WITH CHECK (id=uid)` | ✅ Pass | |
| payout_info | owner update | `USING + WITH CHECK (id=uid)` | ✅ Pass | |
| articles | public_read_published | `USING (is_published=true AND published_at<=now())` | ✅ Pass | No TO clause = all roles (correct) |

---

## Schema Integrity Tests

| Table | Check | Result | Notes |
|-------|-------|--------|-------|
| events | slug UNIQUE NOT NULL | ✅ Enforced | Prevents scraper duplicate upserts |
| events | date/venue NOT NULL | ✅ Enforced | |
| tickets | price numeric NOT NULL | ✅ Enforced | |
| tickets | status CHECK ('active','sold','cancelled') | ✅ Enforced | |
| tickets | split_type CHECK constraint | ✅ Enforced | |
| tickets | seating_type CHECK constraint | ✅ Enforced | |
| orders | stripe_session_id UNIQUE | ✅ Enforced | Idempotency guarantee |
| orders | status CHECK ('pending','paid','refunded') | ✅ Enforced | |
| payouts | amount NOT NULL | ✅ Enforced | Fixed in 008 |
| payouts | status CHECK ('pending','sent') | ✅ Enforced | |
| payouts | order_id FK → orders | ✅ Enforced | |
| profiles | id FK → auth.users ON DELETE CASCADE | ✅ Enforced | |
| profiles | verified NOT NULL DEFAULT false | ✅ Enforced | |
| payout_info | id FK → auth.users ON DELETE CASCADE | ✅ Enforced | |
| payout_info | updated_at NOT NULL DEFAULT now() | ✅ Enforced | |
| articles | slug UNIQUE NOT NULL | ✅ Enforced | |
| articles | is_published NOT NULL DEFAULT false | ✅ Enforced | |
| articles | category CHECK constraint | ✅ Enforced | |

---

## Edge Function Tests

### stripe-webhook

| Check | Result | Notes |
|-------|--------|-------|
| Rejects missing stripe-signature → 400 | ✅ Pass | Line 30-32 |
| Rejects invalid signature → 400 | ✅ Pass | `constructEventAsync` throws, caught → 400 |
| Unknown event types acknowledged → 200 | ✅ Pass | Line 56 |
| `checkout.session.completed` marks order paid | ✅ Pass | |
| `checkout.session.completed` marks ticket sold | ✅ Pass | |
| `checkout.session.completed` creates payout | ✅ Pass | Non-fatal on error (logged) |
| Idempotency — second delivery returns early | ✅ Pass | `.eq('status','pending')` guard; `maybeSingle()` returns null → early return |
| `checkout.session.expired` releases ticket reservation | ✅ Pass | `unreserve_ticket` RPC called |
| `checkout.session.expired` removes pending order | ✅ Pass | Deletes by session_id + status='pending' |
| SUPABASE_SERVICE_ROLE_KEY not in response body | ✅ Pass | Never serialised into responses |
| Email failure is non-fatal | ✅ Pass | Logs error, still returns 200 |
| Payout creation failure is non-fatal | ✅ Pass | Logs error, does not return 500 |

### create-checkout

| Check | Result | Notes |
|-------|--------|-------|
| Reserves ticket via `reserve_ticket` RPC (atomic UPDATE) | ✅ Pass | `reserve_ticket` function (006) uses `WHERE status='active'` |
| Ticket already sold → 409 Conflict | ✅ Pass | RPC returns 0 rows → function returns 409 |
| Stripe session creation failure → unreserves ticket | ✅ Pass | `unreserve_ticket` called on catch |
| Order INSERT failure → unreserves ticket | ✅ Pass | `unreserve_ticket` called on error |
| Returns Stripe checkout URL | ✅ Pass | |
| Malformed request body → handled | ✅ Pass | try/catch at top level |

---

## Bugs Found

### BUG-BE-001: Profiles INSERT policy allows verified=true self-insert
**Severity**: High
**Area**: RLS
**Description**: `012_payout_info.sql` adds an `"owner can insert own profile"` policy with `WITH CHECK (id = auth.uid())` only. No constraint prevents a user from inserting `{ verified: true }`. An authenticated user can claim a "Verified Seller" badge without completing SmartID verification by calling `supabase.from('profiles').insert({ id: user.id, verified: true })` from the frontend.
**Reproduction**:
1. Register new account
2. From browser console: `await supabase.from('profiles').insert({ id: '<your-uid>', verified: true })`
3. Open any listing by that user → "Verified Seller" badge shown
**Fix**: `WITH CHECK (id = auth.uid() AND verified = false AND verified_at IS NULL)`
**Issue**: `issues/2026-03-01-be-qa-profiles-rls-verified-bypass.md`

### BUG-BE-002: Authenticated buyers cannot read tickets on EventDetail
**Severity**: High
**Area**: RLS
**Description**: `"anon read active tickets"` is scoped `TO anon` only. Once a user logs in, Supabase uses the `authenticated` DB role, and no policy grants `TO authenticated` read access to active tickets. The `event_ticket_summary` view (SECURITY DEFINER) still shows counts on EventList, but EventDetail queries `tickets` directly — authenticated buyers see an empty list.
**Reproduction**:
1. Log in as a buyer (non-seller)
2. Navigate to any EventDetail page
3. Ticket listings section is empty despite active tickets existing
**Fix**: New migration — `CREATE POLICY "authenticated read active tickets" ON tickets FOR SELECT TO authenticated USING (status = 'active')`. Same pattern as `004_events_authenticated_read.sql`.
**Issue**: `issues/2026-03-01-be-qa-tickets-rls-authenticated-buyers.md`

---

## Summary

- Policies tested: 20
- Pass: 18 | Fail: 2 | Warning: 0
- Critical issues: 0
- High issues: 2 (BUG-BE-001, BUG-BE-002) — must fix before ship
- Schema checks: 17/17 pass
- Edge Function checks: 14/14 pass
