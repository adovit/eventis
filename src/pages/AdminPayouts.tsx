import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Payout {
  id: string
  seller_id: string
  amount: number
  status: 'pending' | 'sent'
  payout_date: string | null
  stripe_transfer_id: string | null
  created_at: string
  orders: {
    events: {
      title: string
    } | null
  } | null
}

const STATUS_COLOURS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
}

export default function AdminPayouts() {
  const { user, loading: authLoading } = useAuth()

  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Per-payout state: tracks the transfer ID being typed in each row
  const [transferInputs, setTransferInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  // Per-row save errors — keyed by payout ID, mirrors transferInputs pattern
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  // All hooks are declared unconditionally above; conditional returns follow
  useEffect(() => {
    if (!user?.user_metadata?.is_admin) return
    load()
  }, [user])

  async function load() {
    const { data, error } = await supabase
      .from('payouts')
      .select('id, seller_id, amount, status, payout_date, stripe_transfer_id, created_at, orders(events(title))')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setPayouts((data as Payout[]) ?? [])
    }
    setLoading(false)
  }

  async function handleMarkSent(payoutId: string) {
    const transferId = transferInputs[payoutId]?.trim()
    if (!transferId) {
      setSaveErrors((prev) => ({ ...prev, [payoutId]: 'Įveskite Stripe transfer ID.' }))
      return
    }

    setSaving(payoutId)
    // Clear this row's error before attempting
    setSaveErrors((prev) => { const next = { ...prev }; delete next[payoutId]; return next })

    const { error } = await supabase
      .from('payouts')
      .update({
        status: 'sent',
        payout_date: new Date().toISOString(),
        stripe_transfer_id: transferId,
      })
      .eq('id', payoutId)

    if (error) {
      setSaveErrors((prev) => ({ ...prev, [payoutId]: error.message }))
    } else {
      // Refresh the list to reflect the update
      await load()
    }
    setSaving(null)
  }

  // Redirect non-admins after auth resolves — placed after all hooks
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin — Išmokos</h1>

      {payouts.length === 0 ? (
        <p className="text-gray-500">Nėra išmokų.</p>
      ) : (
        <ul className="space-y-4">
          {payouts.map((payout) => {
            const saleDate = new Date(payout.created_at).toLocaleDateString('lt-LT')
            const isPending = payout.status === 'pending'

            return (
              <li
                key={payout.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {payout.orders?.events?.title ?? '—'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Pardavėjas: <span className="font-mono text-xs">{payout.seller_id}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Data: {saleDate}
                      {payout.stripe_transfer_id && (
                        <> · Transfer: <span className="font-mono text-xs">{payout.stripe_transfer_id}</span></>
                      )}
                    </p>
                  </div>

                  {/* Amount + status */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-gray-900">{payout.amount.toFixed(2)} €</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOURS[payout.status]}`}>
                      {isPending ? 'Laukiama' : 'Išsiųsta'}
                    </span>
                  </div>
                </div>

                {/* Mark as sent form — only for pending payouts */}
                {isPending && (
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Stripe transfer ID (tr_...)"
                        value={transferInputs[payout.id] ?? ''}
                        onChange={(e) =>
                          setTransferInputs((prev) => ({ ...prev, [payout.id]: e.target.value }))
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <button
                        onClick={() => handleMarkSent(payout.id)}
                        disabled={saving === payout.id}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        {saving === payout.id ? 'Saugoma...' : 'Pažymėti kaip išsiųstą'}
                      </button>
                    </div>
                    {saveErrors[payout.id] && (
                      <p className="mt-1 text-sm text-red-600">{saveErrors[payout.id]}</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
