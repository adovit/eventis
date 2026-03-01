import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from '../components/ui'

// Matches the Supabase join result shape for tickets + events (many-to-one)
interface Ticket {
  id: string
  price: number
  quantity: number
  seating_type: string | null
  section: string | null
  row: string | null
  seat_from: number | null
  seat_to: number | null
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  events: {
    title: string
    date: string | null
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktyvus',
  reserved: 'Rezervuotas',
  sold: 'Parduotas',
  cancelled: 'Atšauktas',
}

const STATUS_COLOURS: Record<string, string> = {
  active: 'bg-success-100 text-success-700',
  reserved: 'bg-warning-100 text-warning-700',
  sold: 'bg-info-100 text-info-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
}

export default function MyListings() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, price, quantity, seating_type, section, row, seat_from, seat_to, status, created_at, events(title, date)')
      .eq('seller_id', user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      // Supabase returns the joined relation as an object (many-to-one);
      // cast to Ticket[] since generated types are not yet configured.
      setTickets((data as Ticket[]) ?? [])
    }
    setLoading(false)
  }

  async function handleCancel(id: string) {
    setCancelError(null)

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      // Show inline error — don't replace the entire page
      setCancelError(error.message)
      return
    }

    // Re-fetch to reflect the updated status
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-neutral-500">Kraunama...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-danger-600">Klaida: {error}</p>
      </div>
    )
  }

  return (
    <>
      {/* Page hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Mano skelbimai</h1>
            <p className="text-sm text-neutral-500 mt-1">Valdykite savo aktyvius ir parduotus bilietus.</p>
          </div>
          <Link
            to="/sell"
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            + Naujas skelbimas
          </Link>
        </div>
      </div>

    <div className="max-w-3xl mx-auto px-4 py-8">

      {cancelError && (
        <p className="text-sm text-red-600 mb-4">Atšaukti nepavyko: {cancelError}</p>
      )}

      {tickets.length === 0 ? (
        <EmptyState
          icon="🎟"
          title="Nėra skelbimų"
          description="Parduokite bilietą, kurio nebenorite naudoti."
          action={{ label: 'Paskelbti bilietą', href: '/sell' }}
        />
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => {
            const eventDate = ticket.events?.date
              ? new Date(ticket.events.date).toLocaleDateString('lt-LT')
              : null

            const seatInfo = ticket.seating_type === 'seated' && ticket.seat_from
              ? [
                  ticket.section && `Sekt. ${ticket.section}`,
                  ticket.row && `Eilė ${ticket.row}`,
                  `Vietos ${ticket.seat_from}–${ticket.seat_to ?? ticket.seat_from}`,
                ].filter(Boolean).join(', ')
              : 'Stovimas'

            return (
              <li
                key={ticket.id}
                className="bg-white rounded-xl border border-neutral-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">
                    {ticket.events?.title ?? '—'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {eventDate ?? 'Data nežinoma'} · <span className="font-mono tabular-nums">{ticket.price.toFixed(2)} €</span> · {ticket.quantity} vnt. · {seatInfo}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOURS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  {ticket.status === 'active' && (
                    <button
                      onClick={() => handleCancel(ticket.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Atšaukti
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
    </>
  )
}
