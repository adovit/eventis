/**
 * Scraper for kakava.lt
 *
 * Uses the public kakava.lt REST API instead of Puppeteer.
 * No Bright Data / headless browser needed.
 *
 * Endpoint: GET https://api.kakava.lt/api/v1/event/show?page=1
 * Requires: Accept-Language: lt-LT,lt;q=0.9 header (otherwise 400)
 *
 * priceFrom is in centai — divide by 100 for EUR.
 * Only returns shows where state = "Selling" and startDateTime >= tomorrow.
 */

import axios from 'axios'
import { type ScrapedEvent } from './utils.js'

const API_URL = 'https://api.kakava.lt/api/v1/event/show'
const FRONT_BASE = 'https://kakava.lt'

interface KakavaShow {
  shortId: number
  eventTitle: string
  eventTitleSlug: string | null
  startDateTime: string | null
  state: string
  priceFrom: number | null
  location?: { name: string }
  city?: { name: string }
  eventPicture?: { desktopPictureUrl: string }
}

/**
 * Infers a Lithuanian event category from the event title via keyword matching.
 * Returns null if no keyword matches — better than a wrong guess.
 */
function inferKakavaCategory(title: string): string | null {
  const t = title.toLowerCase()
  if (/krepšin|žalgiris|rungtyn|futbol|sportas|bokso|imtyni/.test(t)) return 'Sportas'
  if (/koncer|muzika|grupė|dainink|orchestra|filharmoni|operos/.test(t)) return 'Koncertai'
  if (/festiv/.test(t)) return 'Festivalis'
  if (/teatr|spektakl|opera|balet|cirkas/.test(t)) return 'Teatras'
  if (/pramog|šou|show/.test(t)) return 'Pramogos'
  return null
}

export async function scrapeKakava(): Promise<ScrapedEvent[]> {
  const res = await axios.get(API_URL, {
    params: { page: 1 },
    headers: { 'Accept-Language': 'lt-LT,lt;q=0.9' },
    timeout: 30_000,
  })

  const shows: KakavaShow[] = res.data?.shows ?? []

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const events: ScrapedEvent[] = []

  for (const show of shows) {
    // Skip sold-out / expired shows
    if (show.state === 'SaleExpired') continue

    // Only future events (from tomorrow)
    const startDate = show.startDateTime ? new Date(show.startDateTime) : null
    if (startDate && startDate < tomorrow) continue

    const titleSlug = show.eventTitleSlug ?? String(show.shortId)

    events.push({
      title: show.eventTitle,
      date: show.startDateTime ?? null,
      // Combine venue and city so the city filter ("Kaunas") matches even when
      // the location field is a venue name ("Žalgirio Arena, Kaunas").
      location: show.location?.name && show.city?.name
        ? `${show.location.name}, ${show.city.name}`
        : show.location?.name ?? show.city?.name ?? null,
      category: inferKakavaCategory(show.eventTitle),
      image_url: show.eventPicture?.desktopPictureUrl ?? null,
      detail_url: `${FRONT_BASE}/renginys/${titleSlug}/${show.shortId}`,
      source: 'kakava',
      price_from: typeof show.priceFrom === 'number' ? show.priceFrom / 100 : null,
      // Use shortId as slug suffix — guarantees uniqueness even when title+date collide
      slug: `kakava-${show.shortId}`,
    })
  }

  return events
}
