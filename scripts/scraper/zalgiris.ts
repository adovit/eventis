/**
 * Scraper for zalgiris.koobin.com (Žalgiris Arena events)
 *
 * koobin is a ticketing SaaS; its markup follows a consistent pattern across venues.
 * NOTE: Selectors were inferred from koobin's typical HTML output.
 * Verify on first run — zalgiris.koobin.com returns 403 to plain requests,
 * so Bright Data proxy is required.
 */

import * as cheerio from 'cheerio'
import { fetchPage, type ScrapedEvent } from './utils.js'

const BASE_URL = 'https://zalgiris.koobin.com'
const LIST_URL = BASE_URL   // event list is on the root page

/** Parses "15,00 €" or "nuo 15 €" → 15.00, or returns null. */
function parsePrice(raw: string): number | null {
  const match = raw.match(/[\d]+[,.]?[\d]*/)
  if (!match) return null
  return parseFloat(match[0].replace(',', '.'))
}

export async function scrapeZalgiris(): Promise<ScrapedEvent[]> {
  const html = await fetchPage(LIST_URL)
  const $ = cheerio.load(html)
  const events: ScrapedEvent[] = []

  // koobin renders events as cards with class "event" or similar.
  // Each card is an <a> or contains one leading to the event detail.
  $('a[href*="/event/"], a[href*="/events/"], .koobin-event, .event-item, article').each((_, el) => {
    const $el = $(el)

    const detailHref = $el.is('a') ? $el.attr('href') : $el.find('a').first().attr('href')
    const title = $el.find('h2, h3, [class*="title"], [class*="name"]').first().text().trim()
    const dateText = $el.find('time, [class*="date"], [data-date]').first().attr('datetime')
      || $el.find('time, [class*="date"]').first().text().trim()
    const location = $el.find('[class*="location"], [class*="venue"]').first().text().trim() || 'Žalgirio Arena, Kaunas'
    const category = $el.find('[class*="category"], [class*="type"]').first().text().trim() || 'Sportas'
    const imageSrc = $el.find('img').first().attr('src') || null
    const priceRaw = $el.find('[class*="price"]').first().text().trim()

    if (!title) return

    const absDetail = detailHref
      ? (detailHref.startsWith('http') ? detailHref : `${BASE_URL}${detailHref}`)
      : null

    events.push({
      title,
      date: dateText || null,
      location,
      category,
      image_url: imageSrc ? (imageSrc.startsWith('http') ? imageSrc : `${BASE_URL}${imageSrc}`) : null,
      detail_url: absDetail,
      source: 'zalgiris',
      price_from: parsePrice(priceRaw),
    })
  })

  return events
}
