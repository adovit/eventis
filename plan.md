# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Close the three Iteration 5.8 backlog stories: localise registration error messages (US-111), add error state to Profile page (US-112), add DB-level IBAN format constraint (US-113).

## Critical Decisions

- **`localiseError()` in Register.tsx copied from Login.tsx pattern** — same function shape, same call site; adds LT messages for "User already registered" and "Password should be at least 6 characters"; generic fallback in Lithuanian.
- **Profile.tsx error state** — add `loadError` state; check each `Promise.all` result's `.error` field after resolution; `setLoading(false)` stays in `finally` block to guarantee spinner clears on both success and failure.
- **Migration is `015_payout_info_iban_check.sql`** — migrations 013 (articles) and 014 (rls_fixes) already exist; next available number is 015.

---

## Tasks

- [x] 🟩 **Step 1: Localise Register.tsx error messages (US-111)**
  - [x] 🟩 Add `localiseError(msg: string): string` function to `Register.tsx` mapping: "User already registered" → LT, "Password should be at least 6 characters" → LT, generic fallback → LT
  - [x] 🟩 Change `setError(error.message)` → `setError(localiseError(error.message))` in `handleSubmit`

- [x] 🟩 **Step 2: Profile page error state (US-112)**
  - [x] 🟩 Add `loadError` state (`string | null`) to `Profile.tsx`
  - [x] 🟩 Wrap `load()` body in try/catch; after `Promise.all`, check each result's `.error` field; if any error, `setLoadError('Nepavyko įkelti duomenų. Bandykite dar kartą.')` and return early; always `setLoading(false)` in finally
  - [x] 🟩 Render error message (`text-danger-text`) when `loadError` is set and loading is false

- [x] 🟩 **Step 3: DB IBAN format constraint migration (US-113)**
  - [x] 🟩 Create `supabase/migrations/015_payout_info_iban_check.sql` — `ALTER TABLE payout_info ADD CONSTRAINT iban_format CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$')` with DOWN comment
