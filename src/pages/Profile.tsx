import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface ProfileData {
  verified: boolean
  verified_at: string | null
}

interface PayoutInfo {
  iban: string | null
  updated_at: string
}

// Display IBAN masked — show first 4 chars, mask the rest
function maskIban(iban: string): string {
  return iban.slice(0, 4) + ' **** **** **** ****'
}

// Lithuanian IBAN: LT + exactly 18 digits = 20 chars total
const IBAN_REGEX = /^LT\d{18}$/

export default function Profile() {
  const { user } = useAuth()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null)
  const [listingCount, setListingCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [ibanInput, setIbanInput] = useState('')
  const [editingIban, setEditingIban] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ibanError, setIbanError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    if (!user) return

    try {
      // Run all fetches in parallel
      const [profileRes, payoutRes, listingsRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('verified, verified_at').eq('id', user.id).maybeSingle(),
        supabase.from('payout_info').select('iban, updated_at').eq('id', user.id).maybeSingle(),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('seller_id', user.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id),
      ])

      // Surface any query-level error (RLS block, network, etc.)
      if (profileRes.error || payoutRes.error || listingsRes.error || ordersRes.error) {
        setLoadError('Nepavyko įkelti duomenų. Bandykite dar kartą.')
        return
      }

      setProfile(profileRes.data as ProfileData | null)

      const payout = payoutRes.data as PayoutInfo | null
      setPayoutInfo(payout)
      // Pre-fill input if IBAN already saved; enter edit mode if not
      setIbanInput(payout?.iban ?? '')
      setEditingIban(!payout?.iban)

      setListingCount(listingsRes.count ?? 0)
      setOrderCount(ordersRes.count ?? 0)
    } catch {
      setLoadError('Nepavyko įkelti duomenų. Bandykite dar kartą.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveIban() {
    if (!user) return

    // Normalise: strip spaces, uppercase
    const normalised = ibanInput.replace(/\s/g, '').toUpperCase()
    setIbanInput(normalised)

    if (!IBAN_REGEX.test(normalised)) {
      setIbanError('IBAN turi prasidėti LT ir turėti 20 simbolių (pvz. LT123456789012345678)')
      return
    }

    setIbanError(null)
    setSaving(true)
    setSaveSuccess(false)

    const { error } = await supabase
      .from('payout_info')
      .upsert(
        { id: user.id, iban: normalised, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      )

    setSaving(false)

    if (error) {
      setIbanError('Nepavyko išsaugoti. Bandykite dar kartą.')
      return
    }

    setPayoutInfo({ iban: normalised, updated_at: new Date().toISOString() })
    setEditingIban(false)
    setSaveSuccess(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-neutral-500">Kraunama...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-danger-text">{loadError}</p>
      </div>
    )
  }

  if (!user) return null

  const memberSince = new Date(user.created_at).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const initial = user.email?.[0].toUpperCase() ?? '?'

  return (
    <>
      {/* Page hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-neutral-900">Mano paskyra</h1>
          <p className="text-sm text-neutral-500 mt-1">Jūsų asmeninė informacija ir nustatymai.</p>
        </div>
      </div>

    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Card 1 — Account info */}
      <div className="bg-white rounded-xl border border-neutral-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">Paskyra</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{user.email}</p>
            <p className="text-sm text-neutral-500">Narys nuo: {memberSince}</p>
          </div>
        </div>
      </div>

      {/* Card 2 — Identity verification */}
      <div className="bg-white rounded-xl border border-neutral-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">
          Tapatybės patvirtinimas
        </h2>
        {(profile?.verified || user.user_metadata?.verified) ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-success-100 text-success-700 text-sm font-medium rounded-full">
              ✓ Patvirtintas
            </span>
            <p className="text-sm text-neutral-500">
              Jūsų skelbimuose rodomas „Patvirtintas pardavėjas" ženkliukas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 bg-warning-100 text-warning-700 text-sm font-medium rounded-full">
              Nepatvirtintas
            </span>
            <p className="text-sm text-neutral-500">
              Patvirtinkite tapatybę per SmartID, kad pirkėjai matytų jūsų patikimumo ženkliuką.{' '}
              <Link to="/verify" className="text-brand-600 hover:underline">
                Patvirtinti dabar →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Card 3 — Payout IBAN */}
      <div className="bg-white rounded-xl border border-neutral-200 px-6 py-5">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-1">
          Išmokų gavimas
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          Įveskite savo IBAN numerį, kad gautumėte pajamas už parduotus bilietus.
        </p>

        {!editingIban && payoutInfo?.iban ? (
          /* Saved state — show masked IBAN + edit button */
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Išsaugotas IBAN</p>
              <p className="font-mono text-sm text-neutral-900">{maskIban(payoutInfo.iban)}</p>
            </div>
            <button
              onClick={() => { setEditingIban(true); setSaveSuccess(false) }}
              className="text-sm text-brand-600 hover:underline shrink-0"
            >
              Keisti
            </button>
          </div>
        ) : (
          /* Edit state — IBAN input form */
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                IBAN numeris
              </label>
              <input
                type="text"
                value={ibanInput}
                onChange={(e) => { setIbanInput(e.target.value); setIbanError(null) }}
                placeholder="LT000000000000000000"
                autoCapitalize="characters"
                maxLength={22}
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-neutral-400 mt-1">Formatas: LT + 18 skaitmenų (20 simbolių)</p>
            </div>

            {ibanError && <p className="text-sm text-red-600">{ibanError}</p>}

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveIban}
                disabled={saving}
                className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saugoma...' : 'Išsaugoti IBAN'}
              </button>
              {/* Cancel only shown if there was a previously saved IBAN */}
              {payoutInfo?.iban && (
                <button
                  onClick={() => { setEditingIban(false); setIbanInput(payoutInfo.iban ?? ''); setIbanError(null) }}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Atšaukti
                </button>
              )}
            </div>
          </div>
        )}

        {saveSuccess && (
          <p className="text-sm text-success-600 mt-3">IBAN išsaugotas.</p>
        )}
      </div>

      {/* P1 — Summary stats */}
      <p className="text-sm text-neutral-400 text-center pt-2">
        Skelbimai: {listingCount} · Užsakymai: {orderCount}
      </p>
    </div>
    </>
  )
}
