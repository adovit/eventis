import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/ui'

interface Event {
  id: string
  title: string
  date: string | null
  location: string | null
  category: string | null
  image_url: string | null
  detail_url: string | null
  source: string
  price_from: number | null
  slug: string
}

interface Ticket {
  id: string
  price: number
  quantity: number
  split_type: string | null
  seating_type: string | null
  section: string | null
  row: string | null
  seat_from: number | null
  seat_to: number | null
  seller_id: string
}

interface SellerProfile {
  id: string
  verified: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  bilietai: 'bilietai.lt',
  zalgiris: 'zalgiris.koobin.com',
  kakava: 'kakava.lt',
}

const SPLIT_LABELS: Record<string, string> = {
  any: 'Bet koks',
  none: 'Tik visi',
  avoid_one: 'Vengia likusio',
}

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState<Event | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [sellerProfiles, setSellerProfiles] = useState<Record<string, boolean>>({})
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  // ID of the ticket currently being purchased (null = none in flight)
  const [loadingTicketId, setLoadingTicketId] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!slug) { setNotFound(true); setLoading(false); return }

      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, location, category, image_url, detail_url, source, price_from, slug')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setEvent(data)

      // Fetch active seller tickets for this event
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, price, quantity, split_type, seating_type, section, row, seat_from, seat_to, seller_id')
        .eq('event_id', data.id)
        .eq('status', 'active')
        .order('price', { ascending: true })

      if (ticketError) {
        setTicketsError(ticketError.message)
        setLoading(false)
        return
      }

      const fetchedTickets = ticketData ?? []
      setTickets(fetchedTickets)

      // Fetch verification status for each unique seller — profiles.id = auth.users.id
      const sellerIds = [...new Set(fetchedTickets.map((t) => t.seller_id))]
      if (sellerIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, verified')
          .in('id', sellerIds)

        if (profileError) console.error('profiles fetch failed:', profileError.message)

        const profileMap: Record<string, boolean> = {}
        for (const p of (profileData as SellerProfile[] | null) ?? []) {
          profileMap[p.id] = p.verified
        }
        setSellerProfiles(profileMap)
      }

      setLoading(false)
    }
    load()
  }, [slug])

  async function handleBuy(ticketId: string) {
    // Redirect unauthenticated users to login, preserving the current page
    if (!user) {
      navigate('/login?returnUrl=' + encodeURIComponent('/events/' + slug))
      return
    }

    setBuyError(null)
    setLoadingTicketId(ticketId)

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { ticket_id: ticketId },
      })

      if (error || !data?.url) {
        setBuyError(error?.message ?? 'Nepavyko pradėti pirkimo')
        return
      }

      // Redirect to Stripe-hosted Checkout
      window.location.href = data.url
    } catch (err) {
      setBuyError('Nepavyko pradėti pirkimo')
    } finally {
      setLoadingTicketId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="aspect-video w-full rounded-2xl mb-6" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3 mb-8" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">Renginys nerastas</h1>
        <p className="text-neutral-500">Patikrinkite nuorodą arba grįžkite į sąrašą.</p>
        <Link to="/" className="text-brand-600 hover:underline text-sm">← Visi renginiai</Link>
      </div>
    )
  }

  const dateLabel = event.date
    ? new Date(event.date).toLocaleDateString('lt-LT', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const timeLabel = event.date
    ? new Date(event.date).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-6">
        ← Visi renginiai
      </Link>

      {/* Hero image */}
      {event.image_url && (
        <div className="rounded-xl overflow-hidden mb-6 aspect-video bg-gray-100">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Category + source badge */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {event.category && (
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
            {event.category}
          </span>
        )}
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {SOURCE_LABELS[event.source] ?? event.source}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

      {/* Meta */}
      <dl className="space-y-2 mb-8 text-sm text-gray-700">
        {dateLabel && (
          <div className="flex gap-2">
            <dt className="font-medium w-24 shrink-0 text-gray-500">Data</dt>
            <dd>{dateLabel}{timeLabel && timeLabel !== '00:00' ? `, ${timeLabel}` : ''}</dd>
          </div>
        )}
        {event.location && (
          <div className="flex gap-2">
            <dt className="font-medium w-24 shrink-0 text-gray-500">Vieta</dt>
            <dd>{event.location}</dd>
          </div>
        )}
        {event.price_from != null && (
          <div className="flex gap-2">
            <dt className="font-medium w-24 shrink-0 text-gray-500">Kaina nuo</dt>
            <dd className="font-semibold font-mono tabular-nums">€ {event.price_from.toFixed(2)}</dd>
          </div>
        )}
      </dl>

      {/* Available seller tickets */}
      {ticketsError && (
        <p className="text-sm text-red-500 mb-4">
          Nepavyko įkelti bilietų: {ticketsError}
        </p>
      )}
      {buyError && (
        <p className="text-sm text-red-600 mb-4">{buyError}</p>
      )}
      {/* No tickets message — shown when load succeeded but no active listings exist */}
      {!ticketsError && tickets.length === 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Parduodami bilietai</h2>
          <p className="text-sm text-gray-500">
            Šiuo metu nėra parduodamų bilietų.{' '}
            {event.detail_url && (
              <a
                href={event.detail_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Įsigyti bilietą originaliai →
              </a>
            )}
          </p>
        </div>
      )}

      {!ticketsError && tickets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Parduodami bilietai</h2>
          <ul className="space-y-2">
            {tickets.map((ticket) => {
              const seatInfo = ticket.seating_type === 'seated' && ticket.seat_from
                ? [
                    ticket.section && `Sekt. ${ticket.section}`,
                    ticket.row && `Eilė ${ticket.row}`,
                    `Vietos ${ticket.seat_from}–${ticket.seat_to ?? ticket.seat_from}`,
                  ].filter(Boolean).join(', ')
                : 'Stovimas'

              const isBuying = loadingTicketId === ticket.id

              return (
                <li
                  key={ticket.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm"
                >
                  {/* Left: seat details + verified badge */}
                  <div>
                    <span className="text-gray-500">
                      {ticket.quantity} vnt. · {seatInfo}
                      {ticket.split_type && ticket.split_type !== 'any' && (
                        <> · {SPLIT_LABELS[ticket.split_type]}</>
                      )}
                    </span>
                    {sellerProfiles[ticket.seller_id] && (
                      <span className="ml-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Patvirtintas
                      </span>
                    )}
                  </div>

                  {/* Right: price + CTA — right-aligned block */}
                  <div className="flex items-center gap-3 shrink-0 ml-4 text-right">
                    <div>
                      <div className="font-semibold font-mono tabular-nums text-gray-900">
                        € {ticket.price.toFixed(2)}
                      </div>
                      <div className="text-text-muted text-xs">/ bilietas</div>
                    </div>
                    <button
                      onClick={() => handleBuy(ticket.id)}
                      disabled={isBuying || loadingTicketId !== null}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBuying ? 'Kraunama...' : 'Pirkti'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Link to original ticket source */}
      {event.detail_url && (
        <a
          href={event.detail_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-indigo-600 hover:underline"
        >
          Žiūrėti originalų šaltinį →
        </a>
      )}
    </div>
  )
}
