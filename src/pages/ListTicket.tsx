import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Strips Lithuanian diacritics so "gargzdai" matches "Gargždai"
const LT_MAP: Record<string, string> = {
  'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
}
function transliterate(s: string): string {
  return s.replace(/[ąčęėįšųūž]/g, (c) => LT_MAP[c] ?? c)
}

interface EventResult {
  id: string
  title: string
  date: string | null
}

export default function ListTicket() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── Event search ─────────────────────────────────────────────────────────────
  const [eventQuery, setEventQuery] = useState('')
  const [eventResults, setEventResults] = useState<EventResult[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventResult | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  async function handleEventSearch(query: string) {
    setEventQuery(query)
    setSelectedEvent(null)

    // Trim before length check so "ry " doesn't pass the gate but produce 0 results
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setEventResults([])
      return
    }

    // Split into tokens; transliterate so "gargzdai" matches "Gargždai"
    // Use first token for the broad DB query, then filter client-side for all tokens
    const tokens = trimmed.toLowerCase().split(/\s+/).map(transliterate)

    const { data } = await supabase
      .from('events')
      .select('id, title, date')
      .ilike('title', `%${tokens[0]}%`)
      .eq('is_active', true)
      .order('date', { ascending: true })
      .limit(20)

    const results = (data ?? []).filter((ev) => {
      const normalizedTitle = transliterate(ev.title.toLowerCase())
      return tokens.every((t) => normalizedTitle.includes(t))
    })
    setEventResults(results.slice(0, 8))
  }

  function selectEvent(event: EventResult) {
    setSelectedEvent(event)
    setEventQuery(event.title)
    setEventResults([])
  }

  // Close dropdown when clicking outside the search container
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setEventResults([])
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // ── Form fields ───────────────────────────────────────────────────────────────
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [splitType, setSplitType] = useState<'any' | 'none' | 'avoid_one'>('any')
  const [seatingType, setSeatingType] = useState<'seated' | 'standing'>('standing')
  const [section, setSection] = useState('')
  const [row, setRow] = useState('')
  const [seatFrom, setSeatFrom] = useState('')
  const [seatTo, setSeatTo] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSeatingChange(type: 'seated' | 'standing') {
    setSeatingType(type)
    if (type === 'standing') {
      // Clear seat fields when switching to standing
      setSection('')
      setRow('')
      setSeatFrom('')
      setSeatTo('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)

    if (!selectedEvent) {
      setError('Pasirinkite renginį iš sąrašo.')
      return
    }
    if (!pdfFile) {
      setError('Įkelkite bilieto PDF failą.')
      return
    }
    if (!user) {
      setError('Sesija baigėsi. Prisijunkite iš naujo.')
      setSubmitting(false)
      return
    }

    setSubmitting(true)

    // 1. Upload PDF to Storage: ticket-pdfs/{uid}/{uuid}.pdf
    const fileName = `${crypto.randomUUID()}.pdf`
    const storagePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('ticket-pdfs')
      .upload(storagePath, pdfFile, { contentType: 'application/pdf' })

    if (uploadError) {
      setError(`PDF įkėlimas nepavyko: ${uploadError.message}`)
      setSubmitting(false)
      return
    }

    // 2. Insert ticket row
    const { error: insertError } = await supabase.from('tickets').insert({
      event_id: selectedEvent.id,
      seller_id: user.id,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      split_type: splitType,
      seating_type: seatingType,
      section: section || null,
      row: row || null,
      seat_from: seatFrom ? parseInt(seatFrom, 10) : null,
      seat_to: seatTo ? parseInt(seatTo, 10) : null,
      ticket_file_url: storagePath,
    })

    if (insertError) {
      // Clean up the uploaded PDF — the ticket row failed, don't leave an orphan
      await supabase.storage.from('ticket-pdfs').remove([storagePath])
      setError(`Skelbimo sukurti nepavyko: ${insertError.message}`)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    navigate('/my-listings')
  }

  const isVerified = !!user?.user_metadata?.verified

  return (
    <>
      {/* Page hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-neutral-900">Parduokite savo bilietą</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Saugiai, greitai, be rūpesčių. Užpildykite formą ir mes pasirūpinsime likusiu.
          </p>
        </div>
      </div>

    <div className="max-w-xl mx-auto px-4 py-8">

      {/* Verification gate — soft block for unverified sellers */}
      {!isVerified && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3">
          <span className="mt-0.5 text-yellow-500 shrink-0">⚠</span>
          <div className="text-sm text-yellow-800">
            Norėdami paskelbti bilietą, patvirtinkite tapatybę.{' '}
            <Link to="/verify" className="font-semibold underline hover:text-yellow-900">
              Patvirtinti dabar
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Event search */}
        <div className="relative" ref={searchContainerRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Renginys
          </label>
          <input
            type="text"
            required
            placeholder="Ieškoti renginio..."
            value={eventQuery}
            onChange={(e) => handleEventSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {eventResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-md mt-1 max-h-60 overflow-y-auto">
              {eventResults.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => selectEvent(ev)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50"
                  >
                    <span className="font-medium text-gray-900">{ev.title}</span>
                    {ev.date && (
                      <span className="ml-2 text-gray-400 text-xs">
                        {new Date(ev.date).toLocaleDateString('lt-LT')}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Price + Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kaina (€)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kiekis
            </label>
            <input
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Split type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pardavimo tipas
          </label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as typeof splitType)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="any">Bet koks</option>
            <option value="none">Tik visi kartu</option>
            <option value="avoid_one">Vengti likusio vieno</option>
          </select>
        </div>

        {/* Seating type */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Sėdimumas</p>
          <div className="flex gap-4">
            {(['standing', 'seated'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="seatingType"
                  value={type}
                  checked={seatingType === type}
                  onChange={() => handleSeatingChange(type)}
                  className="accent-indigo-600"
                />
                {type === 'standing' ? 'Stovimas' : 'Sėdimas'}
              </label>
            ))}
          </div>
        </div>

        {/* Seat fields — only when seated */}
        {seatingType === 'seated' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sektorius</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eilė</label>
              <input
                type="text"
                value={row}
                onChange={(e) => setRow(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vieta nuo</label>
              <input
                type="number"
                min="1"
                value={seatFrom}
                onChange={(e) => setSeatFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vieta iki</label>
              <input
                type="number"
                min="1"
                value={seatTo}
                onChange={(e) => setSeatTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* PDF upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bilieto PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            required
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !isVerified}
          className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? 'Skelbiama...' : 'Paskelbti skelbimą'}
        </button>
      </form>
    </div>
    </>
  )
}
