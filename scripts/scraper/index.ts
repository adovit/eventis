/**
 * Run all scrapers and upsert results into Supabase.
 * Usage: npm run scrape
 *        (requires VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BRIGHT_DATA_API_TOKEN, BRIGHT_DATA_ZONE in .env)
 */

import { upsertEvents } from './utils.js'
import { scrapeBilietai } from './bilietai.js'
import { scrapeZalgiris } from './zalgiris.js'
import { scrapeKakava } from './kakava.js'

async function run() {
  const sources = [
    { name: 'bilietai', fn: scrapeBilietai },
    { name: 'zalgiris', fn: scrapeZalgiris },
    { name: 'kakava',   fn: scrapeKakava },
  ] as const

  let totalUpserted = 0

  for (const { name, fn } of sources) {
    console.log(`\n[${name}] Scraping...`)
    try {
      const events = await fn()
      console.log(`[${name}] Found ${events.length} events`)

      if (events.length > 0) {
        const count = await upsertEvents(events)
        console.log(`[${name}] Upserted ${count} rows`)
        totalUpserted += count
      }
    } catch (err) {
      // Log and continue — one failed source should not abort the rest
      console.error(`[${name}] ERROR:`, (err as Error).message)
    }
  }

  console.log(`\nDone. Total upserted: ${totalUpserted}`)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
