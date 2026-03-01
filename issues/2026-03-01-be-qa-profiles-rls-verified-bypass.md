# Profiles INSERT policy allows self-inserting verified=true (SmartID bypass)

**Type:** bug
**Priority:** high
**Effort:** small

## TL;DR
The `"owner can insert own profile"` RLS policy has no constraint on the `verified` column, allowing a user to insert `{ id: auth.uid(), verified: true }` from the frontend and claim the "Verified Seller" badge without going through SmartID.

## Current State
`012_payout_info.sql` adds:
```sql
CREATE POLICY "owner can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
```
The comment above it says "INSERT only — no UPDATE. Verified/verified_at are service_role only. A user self-updating 'verified=true' would bypass SmartID — not allowed." However, the `WITH CHECK` only enforces `id = auth.uid()` — it does NOT prevent the inserted row from having `verified = true`.

Any authenticated user can call:
```js
supabase.from('profiles').insert({ id: user.id, verified: true })
```
and receive a "Verified Seller" badge on their listings without completing SmartID verification.

## Expected Outcome
The `WITH CHECK` should prevent inserting with `verified = true` or a non-null `verified_at`:
```sql
CREATE POLICY "owner can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND verified = false
    AND verified_at IS NULL
  );
```
Only the `smartid-verify` Edge Function (which uses `service_role`, bypassing RLS) should be able to set `verified = true`.

## Relevant Files
- `supabase/migrations/012_payout_info.sql` — the policy to fix (line 48–50)
- `supabase/migrations/010_profiles.sql` — table definition (verified column default false)
- `supabase/functions/smartid-verify/` — the only legitimate writer for verified=true

## Risks / Notes
- This must be deployed as a new migration; dropping and recreating the policy is non-destructive (no data loss).
- Users who already self-inserted a `verified=true` row should be audited and reset.
- The `verified` column defaults to `false`, so honest Google OAuth users who insert `{ id: uid }` are unaffected.
