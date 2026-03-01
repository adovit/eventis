import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Ticket {
  id: string
  price: number
  status: 'active' | 'sold' | 'cancelled'
  seller_id: string
  created_at: string
  events: {
    title: string
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktyvus',
  sold: 'Parduotas',
  cancelled: 'Atšauktas',
}

const STATUS_COLOURS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  sold: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function AdminListings() {
  const { user, loading: authLoading } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Per-row deactivation state to avoid double-clicks
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [deactivateErrors, setDeactivateErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user?.user_metadata?.is_admin) return
    load()
  }, [user])

  async function load() {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, price, status, seller_id, created_at, events(title)')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTickets((data as Ticket[]) ?? [])
    }
    setLoading(false)
  }

  async function handleDeactivate(ticketId: string) {
    setDeactivating(ticketId)
    setDeactivateErrors((prev) => { const next = { ...prev }; delete next[ticketId]; return next })

    const { error } = await supabase
      .from('tickets')
      .update({ status: 'cancelled' })
      .eq('id', ticketId)

    if (error) {
      setDeactivateErrors((prev) => ({ ...prev, [ticketId]: error.message }))
    } else {
      await load()
    }
    setDeactivating(null)
  }

  // Redirect non-admins after auth resolves
  if (!authLoading && !user?.user_metadata?.is_admin) {
    return <Navigate to="/" replace />
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-gray-500">Kraunama...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-red-500">Klaida: {error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin — Skelbimai</h1>

      {tickets.length === 0 ? (
        <p className="text-gray-500">Nėra skelbimų.</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => {
            const createdDate = new Date(ticket.created_at).toLocaleDateString('lt-LT')
            const isActive = ticket.status === 'active'

            return (
              <li
                key={ticket.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {ticket.events?.title ?? '—'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Pardavėjas: <span className="font-mono text-xs">{ticket.seller_id}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Data: {createdDate}
                    </p>
                  </div>

                  {/* Price + status + action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-gray-900">{ticket.price.toFixed(2)} €</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOURS[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    {isActive && (
                      <button
                        onClick={() => handleDeactivate(ticket.id)}
                        disabled={deactivating === ticket.id}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {deactivating === ticket.id ? 'Vykdoma...' : 'Deaktyvuoti'}
                      </button>
                    )}
                  </div>
                </div>

                {deactivateErrors[ticket.id] && (
                  <p className="mt-2 text-sm text-red-600">{deactivateErrors[ticket.id]}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
