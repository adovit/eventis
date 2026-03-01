-- Iteration 1 only granted SELECT on events TO anon.
-- Authenticated users (logged-in sellers/buyers) also need to read events
-- (e.g. event list page, event detail page, ticket listing form).
-- Without this policy, logged-in users see 0 events.

CREATE POLICY "authenticated read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);
