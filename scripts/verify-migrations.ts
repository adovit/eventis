/**
 * Verifies that migrations 002–006 are live on the Supabase DB.
 * Queries `tickets` and `orders` via service-role key (bypasses RLS).
 * Usage: npx tsx scripts/verify-migrations.ts
 *        (requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env)
 */

import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verify() {
  const tables = ['tickets', 'orders'] as const

  let allOk = true

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error(`[${table}] ERROR: ${error.message}`)
      allOk = false
    } else {
      console.log(`[${table}] OK — ${count ?? 0} rows`)
    }
  }

  if (allOk) {
    console.log('\nAll tables verified. Migrations are live.')
  } else {
    console.error('\nOne or more tables failed. Check errors above.')
    process.exit(1)
  }
}

verify().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
