-- ============================================================
-- 015: DB-level IBAN format constraint on payout_info
--
-- Enforces Lithuanian IBAN format at the database layer.
-- Client-side validation (Profile.tsx IBAN_REGEX) is the first
-- line of defence; this constraint is the backstop — prevents
-- invalid values even if the client-side check is bypassed.
--
-- Format: LT + exactly 18 digits = 20 characters total.
-- NULL is allowed (seller hasn't entered IBAN yet).
-- ============================================================

ALTER TABLE payout_info
  ADD CONSTRAINT iban_format
    CHECK (iban IS NULL OR iban ~ '^LT[0-9]{18}$');

-- ============================================================
-- DOWN (to reverse this migration):
--
-- ALTER TABLE payout_info DROP CONSTRAINT IF EXISTS iban_format;
-- ============================================================
