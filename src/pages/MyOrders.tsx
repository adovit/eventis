import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from '../components/ui'

interface Order {
  id: string
  amount_paid: number
  status: 'pending' | 'paid' | 'refunded'
  created_at: string
  tickets: {
    price: number
    events: {
      title: string
      date: string | null
    } | null
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Laukiama',
  paid: 'Apmokėta',
  refunded: 'Grąžinta',
}

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-700',
  paid: 'bg-success-100 text-success-700',
  refunded: 'bg-neutral-100 text-neutral-500',
}

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    const { data, error } = await supabase
      .from('orders')
      .select('id, amount_paid, status, created_at, tickets(price, events(title, date))')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setOrders((data as Order[]) ?? [])
    }
    setLoading(false)
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-neutral-900">Mano užsakymai</h1>
          <p className="text-sm text-neutral-500 mt-1">Peržiūrėkite savo pirkimų istoriją.</p>
        </div>
      </div>

    <div className="max-w-3xl mx-auto px-4 py-8">
      {orders.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Nėra užsakymų"
          description="Raskite renginį ir įsigykite bilietą."
          action={{ label: 'Naršyti renginius', href: '/' }}
        />
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const eventDate = order.tickets?.events?.date
              ? new Date(order.tickets.events.date).toLocaleDateString('lt-LT')
              : null

            const orderDate = new Date(order.created_at).toLocaleDateString('lt-LT')

            return (
              <li
                key={order.id}
                className="bg-white rounded-xl border border-neutral-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">
                    {order.tickets?.events?.title ?? '—'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {eventDate ? `Renginys: ${eventDate}` : 'Data nežinoma'}
                    {' · '}
                    <span className="font-mono tabular-nums">{order.amount_paid.toFixed(2)} €</span>
                    {' · '}
                    Užsakyta: {orderDate}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOURS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
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
