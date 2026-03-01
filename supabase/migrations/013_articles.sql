-- ============================================================
-- 013: articles table — public news/blog for SEO
--
-- Admins insert directly via Supabase dashboard (service_role).
-- No in-app CMS this sprint.
--
-- Public can SELECT only rows where:
--   is_published = true AND published_at <= now()
--
-- Body is plain text, rendered on the frontend with
-- whitespace-pre-wrap. No markdown library required.
-- ============================================================

CREATE TABLE IF NOT EXISTS articles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        UNIQUE NOT NULL,
  title           text        NOT NULL,
  excerpt         text,
  body            text        NOT NULL,
  cover_image_url text,
  category        text        CHECK (category IN ('Renginiai', 'Menininkai', 'Naujienos', 'Patarimai')),
  author_name     text        NOT NULL DEFAULT 'Eventis',
  published_at    timestamptz,
  is_published    boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public read: only published articles whose publish date has passed
CREATE POLICY "public_read_published" ON articles
  FOR SELECT USING (is_published = true AND published_at <= now());

-- ============================================================
-- DOWN (to reverse this migration):
--
-- DROP POLICY IF EXISTS "public_read_published" ON articles;
-- DROP TABLE IF EXISTS articles;
-- ============================================================
