import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Order {
  id: string
  amount_paid: number
  status: string
  tickets: {
    price: number
    events: {
      title: string
    } | null
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Laukiama',
  paid: 'Apmokėta',
  refunded: 'Grąžinta',
}

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-500',
}

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Trūksta sesijos ID.')
      setLoading(false)
      return
    }
    load()
  }, [sessionId])

  async function load() {
    // RLS ensures only the authenticated buyer can read their own orders
    const { data, error } = await supabase
      .from('orders')
      .select('id, amount_paid, status, tickets(price, events(title))')
      .eq('stripe_session_id', sessionId!)
      .single()

    if (error || !data) {
      setError('Užsakymas nerastas.')
    } else {
      setOrder(data as Order)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-gray-500">Kraunama...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-red-500">{error ?? 'Užsakymas nerastas.'}</p>
        <Link to="/" className="text-indigo-600 hover:underline text-sm">← Visi renginiai</Link>
      </div>
    )
  }

  const eventTitle = order.tickets?.events?.title ?? '—'
  const statusLabel = STATUS_LABELS[order.status] ?? order.status
  const statusColour = STATUS_COLOURS[order.status] ?? 'bg-gray-100 text-gray-500'

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Užsakymas patvirtintas!</h1>
      <p className="text-gray-500 mb-6">{eventTitle}</p>

      <div className="bg-gray-50 rounded-xl px-6 py-4 mb-6 text-sm text-left space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Suma</span>
          <span className="font-semibold text-gray-900">{order.amount_paid.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Būsena</span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColour}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Email confirmation note */}
      <p className="text-sm text-gray-500 mb-8">
        Bilietai išsiųsti el. paštu. Patikrinkite savo pašto dėžutę.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/my-orders"
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
        >
          Mano užsakymai
        </Link>
        <Link
          to="/"
          className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200"
        >
          Visi renginiai
        </Link>
      </div>
    </div>
  )
}
