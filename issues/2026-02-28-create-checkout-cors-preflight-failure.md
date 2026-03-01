# create-checkout: CORS preflight failure blocks all purchases

**Type:** bug
**Priority:** critical
**Effort:** small

## TL;DR
`create-checkout` Edge Function was missing `x-client-info` and `apikey` in its `Access-Control-Allow-Headers`, causing the browser's CORS preflight to fail before any request reached the function.

## Current State
Clicking "Pirkti" always showed "Failed to send a request to the Edge Function". The error is a `FunctionsFetchError` — a fetch-level failure, meaning the request never reached the Deno handler. Previous fixes (deploying the function, lazy Stripe singleton) didn't help because the real issue was CORS, not the function logic.

## Root Cause
`create-checkout/index.ts` had:
```ts
'Access-Control-Allow-Headers': 'authorization, content-type',
```
But the Supabase JS client sends `apikey` and `x-client-info` with every `supabase.functions.invoke()` call. The browser's OPTIONS preflight rejected these extra headers, and the browser blocked the actual POST request entirely.

`smartid-verify` and `admin-users` both correctly had:
```ts
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
```

## Fix Applied
Updated `create-checkout/index.ts` line 27 to match the other functions. Redeployed.

## Relevant Files
- `supabase/functions/create-checkout/index.ts` — CORS headers (line 27)

## Risks / Notes
- This was introduced when `create-checkout` was first written — it was never browser-tested before deployment.
- All future Edge Functions must use the 4-header CORS pattern: `authorization, x-client-info, apikey, content-type`.
- Purchase flow should now be manually verified end-to-end with a real test purchase.
