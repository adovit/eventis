import * as dotenv from 'dotenv'
import axios, { type AxiosRequestConfig } from 'axios'
import { createClient } from '@supabase/supabase-js'
import https from 'https'

dotenv.config()

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrapedEvent {
  title: string
  date: string | null        // ISO 8601 string or null if unknown
  location: string | null
  category: string | null
  image_url: string | null
  detail_url: string | null
  source: 'bilietai' | 'zalgiris' | 'kakava'
  price_from: number | null
  slug?: string              // optional: overrides auto-generated slug (use when source provides a stable unique ID)
}

// ── Supabase client (server-side only — uses service_role key, never expose to frontend) ──

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
  process.exit(1)
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ── Slug generator ────────────────────────────────────────────────────────────

/**
 * Generates a URL-safe slug from title, date, and source.
 * Format: {source}-{title-kebab}-{YYYYMMDD}
 * Ensures uniqueness across sources even when titles overlap.
 */
const LT_MAP: Record<string, string> = {
  'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i',
  'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
}

export function generateSlug(
  source: ScrapedEvent['source'],
  title: string,
  date: string | null,
): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[ąčęėįšųūž]/g, (c) => LT_MAP[c] ?? c)
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)

  const datePart = date
    ? new Date(date).toISOString().slice(0, 10).replace(/-/g, '')
    : 'nodatum'

  return `${source}-${titleSlug}-${datePart}`
}

// ── Bright Data proxy config ──────────────────────────────────────────────────

/**
 * Returns an axios config that routes all requests through the Bright Data proxy.
 * Throws at call time (not import time) if env vars are missing, so scrapers that
 * don't use the proxy (e.g. bilietai) can import this module without side effects.
 */
export function proxyConfig(): AxiosRequestConfig {
  const token = process.env.BRIGHT_DATA_API_TOKEN
  const zone = process.env.BRIGHT_DATA_ZONE

  if (!token || !zone) {
    throw new Error('BRIGHT_DATA_API_TOKEN and BRIGHT_DATA_ZONE must be set in .env')
  }

  return {
    proxy: {
      host: 'brd.superproxy.io',
      port: 33335,
      auth: {
        username: zone,
        password: token,
      },
      protocol: 'http',
    },
    // Bright Data's proxy presents a self-signed TLS cert — disable verification to allow the connection
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  }
}

/**
 * Fetches a URL through the Bright Data proxy and returns the HTML body.
 */
export async function fetchPage(url: string): Promise<string> {
  const response = await axios.get<string>(url, {
    ...proxyConfig(),
    responseType: 'text',
    timeout: 30_000,
  })
  return response.data
}

// ── Supabase upsert ───────────────────────────────────────────────────────────

/**
 * Upserts scraped events into the `events` table.
 * Conflicts on `slug` — updates all fields except `id`.
 * Returns the number of rows upserted.
 */
export async function upsertEvents(events: ScrapedEvent[]): Promise<number> {
  if (events.length === 0) return 0

  const allRows = events.map((e) => ({
    title: e.title,
    date: e.date,
    location: e.location,
    category: e.category,
    image_url: e.image_url,
    detail_url: e.detail_url,
    source: e.source,
    price_from: e.price_from,
    slug: e.slug ?? generateSlug(e.source, e.title, e.date),
    is_active: true,
    scraped_at: new Date().toISOString(),
  }))

  // Deduplicate by slug within the batch — last write wins
  const slugMap = new Map(allRows.map((r) => [r.slug, r]))
  const rows = Array.from(slugMap.values())

  const { error, count } = await supabase
    .from('events')
    .upsert(rows, { onConflict: 'slug', count: 'exact' })

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`)

  return count ?? rows.length
}
