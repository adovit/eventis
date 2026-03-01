/**
 * Scraper for bilietai.lt
 *
 * Fetches all pages of /lit/renginiai/visi/?page=N and extracts
 * Schema.org Event JSON-LD blocks. Stops when a page returns 0 events.
 *
 * Cookie session is established once and reused across all page requests.
 * Filters out events that have already ended.
 */

import * as cheerio from 'cheerio'
import axios from 'axios'
import { type ScrapedEvent } from './utils.js'

const BASE_URL = 'https://www.bilietai.lt'
const LIST_URL = `${BASE_URL}/lit/renginiai/visi/`
const MAX_PAGES = 50  // safety cap

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }

/** Establishes a bilietai.lt session and returns a Cookie header string. */
async function getSessionCookie(): Promise<string> {
  const cookieJar: string[] = []

  const r1 = await axios.get(BASE_URL, {
    maxRedirects: 0,
    validateStatus: (s) => s < 400,
    headers: HEADERS,
  })
  const c1 = Array.isArray(r1.headers['set-cookie']) ? r1.headers['set-cookie'] : []
  cookieJar.push(...c1.map((c) => c.split(';')[0]))

  const location = r1.headers['location']
  if (location) {
    const r2 = await axios.get(`${BASE_URL}${location}`, {
      maxRedirects: 0,
      validateStatus: (s) => s < 400,
      headers: { ...HEADERS, Cookie: cookieJar.join('; ') },
    })
    const c2 = Array.isArray(r2.headers['set-cookie']) ? r2.headers['set-cookie'] : []
    cookieJar.push(...c2.map((c) => c.split(';')[0]))
  }

  return cookieJar.join('; ')
}

/** Fetches one page of the event listing. */
async function fetchPage(cookie: string, page: number): Promise<string> {
  const url = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`
  const res = await axios.get(url, {
    headers: { ...HEADERS, Cookie: cookie },
    responseType: 'text',
    timeout: 30_000,
  })
  return res.data
}

/** Extracts ScrapedEvent objects from a page's HTML via JSON-LD. */
function extractEvents(html: string, tomorrow: Date): ScrapedEvent[] {
  const $ = cheerio.load(html)
  const events: ScrapedEvent[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    let parsed: unknown
    try {
      parsed = JSON.parse($(el).html() ?? '')
    } catch {
      return
    }

    if (typeof parsed !== 'object' || parsed === null) return
    const ld = parsed as Record<string, unknown>
    if (ld['@type'] !== 'Event') return

    const endDate   = typeof ld.endDate   === 'string' ? ld.endDate   : null
    const startDate = typeof ld.startDate === 'string' ? ld.startDate : null

    // Use endDate for filtering ongoing events (exhibitions etc); fall back to startDate
    const filterDate = endDate ? new Date(endDate) : startDate ? new Date(startDate) : null
    if (filterDate && filterDate < tomorrow) return

    const location = ld.location as Record<string, unknown> | undefined
    const offers   = ld.offers   as Record<string, unknown> | undefined

    // Schema.org location.address may be a PostalAddress object with addressLocality (city).
    // Extract and combine with venue name so city filter substring match works.
    const address  = location?.address as Record<string, unknown> | undefined
    const cityName = typeof address?.addressLocality === 'string' && address.addressLocality
      ? address.addressLocality
      : null

    // Extract numeric ID from URL e.g. /renginiai/koncertai/event-name-102813/ → "102813"
    const detailUrl = typeof ld.url === 'string' ? ld.url : null
    const idMatch   = detailUrl?.match(/-(\d+)\/?$/)
    const uniqueSlug = idMatch ? `bilietai-${idMatch[1]}` : undefined

    // Extract category from URL path segment: /renginiai/{category}/slug-ID/
    // Capitalize first letter and replace hyphens with spaces (e.g. "teatro-renginiai" → "Teatro renginiai")
    const categorySlug = detailUrl?.match(/\/renginiai\/([^/]+)\//)?.[1] ?? null
    const category = categorySlug
      ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, ' ')
      : null

    events.push({
      title: typeof ld.name === 'string' ? ld.name : '',
      date: startDate || null,
      location: (() => {
        const venueName = typeof location?.name === 'string' ? location.name : null
        if (venueName && cityName) return `${venueName}, ${cityName}`
        return venueName ?? cityName
      })(),
      category,
      image_url: typeof ld.image === 'string' ? ld.image : null,
      detail_url: detailUrl,
      source: 'bilietai',
      price_from: typeof offers?.lowPrice === 'number' ? offers.lowPrice : null,
      slug: uniqueSlug,
    })
  })

  return events
}

export async function scrapeBilietai(): Promise<ScrapedEvent[]> {
  const cookie = await getSessionCookie()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const allEvents: ScrapedEvent[] = []

  let consecutiveEmpty = 0

  for (let page = 1; page <= MAX_PAGES; page++) {
    let html: string
    try {
      html = await fetchPage(cookie, page)
    } catch (err) {
      console.error(`[bilietai] Page ${page} fetch failed — skipping: ${(err as Error).message}`)
      continue
    }

    const events = extractEvents(html, tomorrow)

    if (events.length === 0) {
      consecutiveEmpty++
      if (consecutiveEmpty >= 2) {
        console.log(`[bilietai] Page ${page} empty — stopping`)
        break
      }
      console.log(`[bilietai] Page ${page} empty — retrying next`)
      continue
    }

    consecutiveEmpty = 0
    console.log(`[bilietai] Page ${page}: ${events.length} events`)
    allEvents.push(...events)
  }

  return allEvents
}
