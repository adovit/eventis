import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Input, Select, Skeleton } from '../components/ui'

interface Event {
  id: string
  title: string
  date: string | null
  location: string | null
  category: string | null
  image_url: string | null
  slug: string
  price_from: number | null
  source: string
}

interface TicketSummary {
  event_id: string
  ticket_count: number
  min_price: number
}

const PAGE_SIZE = 24

// Lithuanian cities shown in the city filter dropdown
const LT_CITIES = ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys']

// ── Inline SVG icons (no icon library dependency) ────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// ── Value proposition icons (inline SVG — no icon library dependency) ──
function TicketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9z" />
      <line x1="9" y1="7" x2="9" y2="17" strokeDasharray="2 3" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function UserCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
}

// Returns today as YYYY-MM-DD (used for date defaults and min attribute)
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Returns today + N days as YYYY-MM-DD
function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Returns start of current week Monday as YYYY-MM-DD (for the "Šią savaitę" preset)
function startOfWeekISO(): string {
  const d = new Date()
  const day = d.getDay() // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day // roll back to Monday
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

// Returns end of current week Sunday as YYYY-MM-DD
function endOfWeekISO(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

type DatePreset = 'today' | 'week' | 'month' | 'custom'

// Maps each preset to a [from, to] date range
const DATE_PRESETS: Record<DatePreset, { label: string; from: () => string; to: () => string }> = {
  today:  { label: 'Šiandien',      from: todayISO,       to: todayISO },
  week:   { label: 'Šią savaitę',   from: startOfWeekISO, to: endOfWeekISO },
  month:  { label: 'Šį mėnesį',    from: todayISO,       to: () => addDaysISO(30) },
  custom: { label: 'Pasirinkti datą', from: todayISO,     to: () => addDaysISO(30) },
}

// Strips Lithuanian diacritics so "gargzdai" matches "Gargždai", "sauliai" matches "Šiauliai", etc.
const LT_MAP: Record<string, string> = {
  'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
}
function transliterate(s: string): string {
  return s.replace(/[ąčęėįšųūž]/g, (c) => LT_MAP[c] ?? c)
}

// Lithuanian plural: 1 → form1, 2–9 (excl. 11–19) → form2, everything else → form3
function ltPlural(n: number, form1: string, form2: string, form3: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return form1
  if (mod10 >= 2 && mod10 <= 9 && !(mod100 >= 12 && mod100 <= 19)) return form2
  return form3
}

// Skeleton cards shown while events are loading
function EventGridSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="events-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-primary rounded-2xl border border-border overflow-hidden shadow-sm">
            <Skeleton className="aspect-video w-full" rounded="rounded-none" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EventList() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticketSummaries, setTicketSummaries] = useState<Map<string, TicketSummary>>(new Map())

  // Filter state
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')

  // Date preset: 'month' is the default (today → today+30d), matching the old behaviour
  const [datePreset, setDatePreset] = useState<DatePreset>('month')
  const [dateFrom, setDateFrom] = useState(todayISO)
  const [dateTo, setDateTo] = useState(() => addDaysISO(30))

  // When the user selects a quick preset, derive dateFrom/dateTo from it
  function handlePreset(preset: DatePreset) {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setDateFrom(DATE_PRESETS[preset].from())
      setDateTo(DATE_PRESETS[preset].to())
    }
    // 'custom' keeps the current dateFrom/dateTo so the inputs retain their values
  }

  // Pagination
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      // Fetch all events (past + future) so search mode can surface any scraped event.
      // Browse mode narrows to upcoming events via the client-side dateFrom/dateTo filter.
      const [eventsResult, summaryResult] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, date, location, category, image_url, slug, price_from, source')
          .eq('is_active', true)
          .order('date', { ascending: true })
          .range(0, 4999), // Supabase default cap is 1000 — override to load full catalogue
        supabase
          .from('event_ticket_summary')
          .select('event_id, ticket_count, min_price'),
      ])

      if (eventsResult.error) {
        console.error('[EventList] Supabase error:', eventsResult.error)
        setError(eventsResult.error.message)
      } else {
        setEvents(eventsResult.data ?? [])
      }

      // Build event_id → summary lookup map
      const map = new Map<string, TicketSummary>()
      for (const s of (summaryResult.data ?? []) as TicketSummary[]) {
        map.set(s.event_id, s)
      }
      setTicketSummaries(map)

      setLoading(false)
    }
    load()
  }, [])

  // Unique categories derived from fetched data
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))).sort() as string[],
    [events],
  )

  // Client-side filtering with keyword token matching
  const filtered = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    const tokens = trimmed ? trimmed.split(/\s+/).map(transliterate) : []
    const isSearch = tokens.length > 0

    return events.filter((e) => {
      if (isSearch) {
        // Search mode: every token must appear in transliterated title; all other filters bypassed
        const normalizedTitle = transliterate(e.title.toLowerCase())
        return tokens.every((t) => normalizedTitle.includes(t))
      }
      // Browse mode: apply category, city, and date filters
      if (category && e.category !== category) return false
      if (city && !e.location?.toLowerCase().includes(city.toLowerCase())) return false
      if (dateFrom && e.date && e.date < dateFrom) return false
      if (dateTo && e.date && e.date > dateTo + 'T23:59:59') return false
      return true
    })
  }, [events, search, category, city, dateFrom, dateTo])

  // Reset to page 1 whenever any filter input changes
  useEffect(() => {
    setPage(1)
  }, [search, category, city, dateFrom, dateTo, datePreset])

  const isSearchMode = search.trim().length > 0
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  // Search mode shows all results; browse mode paginates
  const paginated = isSearchMode
    ? filtered
    : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Smooth-scroll to the events grid
  function scrollToGrid() {
    document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-danger-600">Klaida: {error}</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Hero section ───────────────────────────────────────── */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bilietai į Lietuvos renginius
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            Perkite ir parduokite antrinius bilietus saugiai.
            Verifikuoti pardavėjai. Mokėjimai apsaugoti.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={scrollToGrid}
              className="px-6 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors"
            >
              Naršyti renginius ↓
            </button>
            {!user && (
              <Link
                to="/sell"
                className="px-6 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Parduoti bilietą →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Value proposition ──────────────────────────────────── */}
      <div className="bg-bg-secondary border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            {/* Stat 1 — event catalogue */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand">
                <TicketIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">500+</p>
                <p className="text-sm font-semibold text-text-secondary mt-0.5">Renginių kataloge</p>
                <p className="text-xs text-text-muted mt-1">Iš bilietai.lt, kakava.lt ir kt.</p>
              </div>
            </div>

            {/* Stat 2 — secure payment */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand">
                <ShieldCheckIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">100%</p>
                <p className="text-sm font-semibold text-text-secondary mt-0.5">Apsaugotas mokėjimas</p>
                <p className="text-xs text-text-muted mt-1">Stripe apsaugoti sandoriai</p>
              </div>
            </div>

            {/* Stat 3 — verified sellers */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-subtle flex items-center justify-center text-brand">
                <UserCheckIcon />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">SmartID</p>
                <p className="text-sm font-semibold text-text-secondary mt-0.5">Verifikuoti pardavėjai</p>
                <p className="text-xs text-text-muted mt-1">Tapatybė patikrinta prieš pardavimą</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Events grid section ─────────────────────────────────── */}
      {loading ? (
        <EventGridSkeleton />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8" id="events-grid">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex-1 min-w-48">
              <Input
                type="text"
                placeholder="Ieškoti renginio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leadingIcon={<SearchIcon />}
                onClear={() => setSearch('')}
              />
            </div>

            <Select
              value={category}
              onChange={setCategory}
              placeholder="Visos kategorijos"
              options={[
                { value: '', label: 'Visos kategorijos' },
                ...categories.map((cat) => ({ value: cat, label: cat })),
              ]}
            />

            <Select
              value={city}
              onChange={setCity}
              placeholder="Visi miestai"
              options={[
                { value: '', label: 'Visi miestai' },
                ...LT_CITIES.map((c) => ({ value: c, label: c })),
              ]}
            />

          </div>

          {/* Date preset chips */}
          <div className="flex flex-wrap gap-2 mb-2">
            {(Object.entries(DATE_PRESETS) as [DatePreset, typeof DATE_PRESETS[DatePreset]][]).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePreset(key)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  datePreset === key
                    ? 'bg-brand text-text-on-brand'
                    : 'bg-bg-surface text-text-secondary border border-border hover:border-border-strong hover:text-text-primary',
                ].join(' ')}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom date range inputs — shown only when 'custom' preset is active */}
          {datePreset === 'custom' && (
            <div className="flex flex-wrap gap-3 mb-2">
              <input
                type="date"
                value={dateFrom}
                min={todayISO()}
                onChange={(e) => { if (e.target.value) setDateFrom(e.target.value) }}
                className="border border-border rounded-lg px-4 py-2 text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
              <input
                type="date"
                value={dateTo}
                min={todayISO()}
                onChange={(e) => { if (e.target.value) setDateTo(e.target.value) }}
                className="border border-border rounded-lg px-4 py-2 text-sm bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
              />
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-neutral-500 mb-4">
            {filtered.length} {ltPlural(filtered.length, 'renginys', 'renginiai', 'renginių')}
          </p>

          {/* Event grid */}
          {paginated.length === 0 ? (
            <p className="text-neutral-500">
              {events.length === 0
                ? 'Šiuo metu nėra artėjančių renginių.'
                : 'Renginių nerasta.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  ticketSummary={ticketSummaries.get(event.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination controls — hidden in search mode and when only 1 page */}
          {!isSearchMode && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Ankstesnis
              </button>
              <span className="text-sm text-neutral-600">
                Puslapis {page} iš {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kitas →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function EventCard({
  event,
  ticketSummary: ts,
}: {
  event: Event
  ticketSummary?: TicketSummary
}) {
  // Parse date into structured parts for scannable display
  const dateObj = event.date ? new Date(event.date) : null
  const dayNum    = dateObj ? dateObj.getDate() : null
  const monthAbbr = dateObj
    ? dateObj.toLocaleDateString('lt-LT', { month: 'short' }).replace('.', '').toUpperCase()
    : null
  const timeStr = dateObj
    ? dateObj.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })
    : null

  const hasTickets  = ts && ts.ticket_count > 0
  const isScarcity  = hasTickets && ts.ticket_count < 5 // show "X liko" chip when fewer than 5

  return (
    <Link
      to={`/events/${event.slug}`}
      className="group block bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* ── Image ─────────────────────────────────────── */}
      <div className="relative aspect-video bg-neutral-100 overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // Branded fallback instead of plain gray text
          <div className="w-full h-full bg-brand-50 flex items-center justify-center text-4xl text-brand-300">
            🎟
          </div>
        )}

        {/* Category pill — overlaid top-left */}
        {event.category && (
          <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-brand-700 backdrop-blur-sm">
            {event.category}
          </span>
        )}

        {/* Scarcity chip — overlaid top-right, only when < 5 tickets remain */}
        {isScarcity && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-danger-600 text-white">
            {ts.ticket_count} liko
          </span>
        )}
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="p-4">
        {/* Date block + title row */}
        <div className="flex gap-3 items-start mb-3">
          {dateObj && (
            <div className="shrink-0 text-center w-10">
              <div className="text-2xl font-bold text-neutral-900 leading-none">{dayNum}</div>
              <div className="text-xs font-semibold text-neutral-400 uppercase mt-0.5">{monthAbbr}</div>
              <div className="text-xs text-neutral-400 mt-1">{timeStr}</div>
            </div>
          )}
          <h2 className="flex-1 font-semibold text-neutral-900 text-base leading-snug line-clamp-2">
            {event.title}
          </h2>
        </div>

        {/* Location row with map pin icon */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
            <svg className="w-3.5 h-3.5 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418-4.418-7-8.015-7-11A7 7 0 0119 10c0 2.985-2.582 6.582-7 11z" />
              <circle cx="12" cy="10" r="2.5" fill="currentColor" stroke="none" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Bottom row: price + ticket count + CTA */}
        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
          <div>
            {hasTickets ? (
              <>
                <span className="text-lg font-bold text-brand font-mono tabular-nums">
                  nuo € {ts.min_price.toFixed(2)}
                </span>
                <span className="text-xs text-neutral-400 ml-1.5">
                  {ts.ticket_count} {ltPlural(ts.ticket_count, 'bilietas', 'bilietai', 'bilietų')}
                </span>
              </>
            ) : event.price_from != null ? (
              <span className="text-sm font-semibold text-neutral-500 font-mono tabular-nums">
                nuo € {event.price_from.toFixed(2)}
              </span>
            ) : (
              <span className="text-sm text-neutral-400">Kaina nenurodyta</span>
            )}
          </div>
          <span className="text-sm font-medium text-brand-600 group-hover:underline">
            Peržiūrėti →
          </span>
        </div>
      </div>
    </Link>
  )
}
