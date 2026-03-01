import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { EmptyState } from '../components/ui'

interface Payout {
  id: string
  amount: number
  status: 'pending' | 'sent'
  payout_date: string | null
  created_at: string
  orders: {
    created_at: string
    events: {
      title: string
      date: string | null
    } | null
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Laukiama',
  sent: 'Išsiųsta',
}

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
}

export default function MyEarnings() {
  const { user } = useAuth()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // null = not yet checked, false = no IBAN saved, true = IBAN saved
  const [hasIban, setHasIban] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    const { data, error } = await supabase
      .from('payouts')
      .select('id, amount, status, payout_date, created_at, orders(created_at, events(title, date))')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      const fetched = (data as Payout[]) ?? []
      setPayouts(fetched)

      // Only check IBAN when there are pending payouts — avoids unnecessary fetch
      if (fetched.some((p) => p.status === 'pending') && user) {
        const { data: payoutInfoData } = await supabase
          .from('payout_info')
          .select('iban')
          .eq('id', user.id)
          .maybeSingle()
        setHasIban(!!(payoutInfoData as { iban: string | null } | null)?.iban)
      }
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-red-500">Klaida: {error}</p>
      </div>
    )
  }

  // Totals by status
  const totalPending = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalSent = payouts
    .filter((p) => p.status === 'sent')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <>
      {/* Page hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-neutral-900">Mano pajamos</h1>
          <p className="text-sm text-neutral-500 mt-1">Stebėkite laukiamas ir gautas išmokas.</p>
        </div>
      </div>

    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Summary totals */}
      {payouts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500 mb-1">Laukiama</p>
            <p className="text-2xl font-bold text-yellow-600 font-mono tabular-nums">{totalPending.toFixed(2)} €</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <p className="text-sm text-gray-500 mb-1">Gauta</p>
            <p className="text-2xl font-bold text-green-600 font-mono tabular-nums">{totalSent.toFixed(2)} €</p>
          </div>
        </div>
      )}

      {/* IBAN nudge — shown only when pending payouts exist and no IBAN is saved */}
      {hasIban === false && payouts.some((p) => p.status === 'pending') && (
        <div className="mb-6 flex items-center justify-between gap-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <span>Norėdami gauti išmokas, pridėkite IBAN numerį savo profilyje.</span>
          <Link to="/profile" className="text-indigo-600 hover:underline shrink-0">
            Eiti į profilį →
          </Link>
        </div>
      )}

      {payouts.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Nėra pajamų"
          description="Pajamos atsiras po to, kai parduosite bilietą."
          action={{ label: 'Parduoti bilietą', href: '/sell' }}
        />
      ) : (
        <ul className="space-y-4">
          {payouts.map((payout) => {
            const eventDate = payout.orders?.events?.date
              ? new Date(payout.orders.events.date).toLocaleDateString('lt-LT')
              : null

            const saleDate = new Date(payout.orders?.created_at ?? payout.created_at)
              .toLocaleDateString('lt-LT')

            return (
              <li
                key={payout.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {payout.orders?.events?.title ?? '—'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {eventDate ? `Renginys: ${eventDate}` : 'Data nežinoma'}
                    {' · '}
                    Pardavimas: {saleDate}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-gray-900 font-mono tabular-nums">{payout.amount.toFixed(2)} €</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOURS[payout.status]}`}>
                    {STATUS_LABELS[payout.status]}
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
