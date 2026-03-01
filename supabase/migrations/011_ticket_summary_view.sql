-- ============================================================
-- 011: event_ticket_summary view
--
-- Aggregates active ticket listings per event.
-- Used by EventList to show ticket availability badges on cards
-- without N+1 queries.
--
-- Security note: views run with definer security (bypasses RLS),
-- but this is intentional — the view already filters status =
-- 'active' so only public data is exposed (counts + min price).
--
-- ⚠️  APPLY THIS IN SUPABASE SQL EDITOR BEFORE DEPLOYING CODE.
--     EventList.tsx queries this view at page load.
-- ============================================================

CREATE OR REPLACE VIEW event_ticket_summary AS
SELECT
  event_id,
  COUNT(*)::int  AS ticket_count,
  MIN(price)     AS min_price
FROM tickets
WHERE status = 'active'
GROUP BY event_id;

-- Allow anonymous and authenticated users to read the view
GRANT SELECT ON event_ticket_summary TO anon, authenticated;
