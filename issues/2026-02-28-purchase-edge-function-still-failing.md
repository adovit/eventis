# Purchase button still returns "Failed to send a request to the Edge Function"

**Type:** bug
**Priority:** critical
**Effort:** small

## TL;DR
`create-checkout` Edge Function is deployed and ACTIVE but buyer still gets a fetch-level failure when clicking "Pirkti" — function appears unreachable at runtime despite being listed as healthy.

## Current State
- `supabase functions list` confirms `create-checkout` STATUS=ACTIVE (version 2, deployed 2026-02-28 18:53:58)
- `STRIPE_SECRET_KEY` confirmed set in Supabase secrets
- Browser receives `FunctionsFetchError: Failed to send a request to the Edge Function` — this is a fetch-level error, not an HTTP error from the function body. Means the function is either not responding or crashing on cold start before it can serve a response.

## Expected Outcome
Clicking "Pirkti" creates a Stripe Checkout session and redirects buyer to Stripe payment page.

## Likely Root Causes to Investigate (in order)
1. **Stripe npm module cold-start crash** — `import Stripe from 'npm:stripe@14'` at module scope + `new Stripe(key, { apiVersion })` also at module scope. If the cold start throws before `Deno.serve()` is reached, the function silently dies and the client receives a connection failure. Check Supabase Dashboard → Functions → `create-checkout` → Logs for any startup errors.
2. **Secrets not yet propagated** — Supabase secrets can take a few minutes to be available to a freshly deployed function. A redeploy after secrets are confirmed may be needed: `npx supabase functions deploy create-checkout --no-verify-jwt`
3. **`STRIPE_SECRET_KEY` format** — confirm the key begins with `sk_live_` and has no trailing whitespace; Stripe constructor will throw synchronously if the key is malformed.

## Relevant Files
- `supabase/functions/create-checkout/index.ts` — the function; lines 8–10 create the Stripe client at module scope (cold-start risk)
- `src/pages/EventDetail.tsx:132` — `supabase.functions.invoke('create-checkout', ...)` — where the client call is made

## Risks / Notes
- This is a P0 — zero purchases can complete until resolved.
- Check Supabase Dashboard → Functions → `create-checkout` → Logs before touching code. If logs show a startup exception, redeploy after fixing. If no logs at all, the function is not being reached.
- Fix path if cold-start crash confirmed: wrap Stripe instantiation in a lazy getter or inside `Deno.serve()` handler so a bad key doesn't kill the module load.
