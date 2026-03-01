import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Step = 'form' | 'pending' | 'success' | 'error'

const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 90_000

export default function Verify() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [personalCode, setPersonalCode] = useState('')
  const [countryCode, setCountryCode] = useState<'LT' | 'EE' | 'LV'>('LT')
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Polling refs — cleared on unmount or success/error
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Tracks the deferred poll start and the post-success nav delay so unmount can cancel them
  const pollStartRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
      if (pollStartRef.current) clearTimeout(pollStartRef.current)
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])

  // If already verified, send to profile (not /sell — no reason to land on listing form)
  useEffect(() => {
    if (user?.user_metadata?.verified) {
      navigate('/profile', { replace: true })
    }
  }, [user, navigate])

  function stopPolling() {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    if (pollStartRef.current) clearTimeout(pollStartRef.current)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)

    const { data, error } = await supabase.functions.invoke('smartid-verify', {
      body: { action: 'initiate', personalCode, countryCode },
    })

    if (error || !data?.sessionId) {
      setErrorMsg('Nepavyko pradėti patvirtinimo. Patikrinkite asmens kodą ir bandykite dar kartą.')
      setSubmitting(false)
      return
    }

    setVerificationCode(data.verificationCode)
    setStep('pending')
    setSubmitting(false)

    const sessionId = data.sessionId
    // Give the mock session a 3-second head-start so the user sees the waiting screen
    startPolling(sessionId, sessionId === 'mock_bypass_session' ? 3000 : 0)
  }

  function startPolling(sessionId: string, initialDelay = 0) {
    // Stop after 90 seconds regardless
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
      setStep('error')
      setErrorMsg('Patvirtinimas nepavyko — baigėsi laikas. Bandykite dar kartą.')
    }, POLL_TIMEOUT_MS)

    // For mock sessions, wait a few seconds so the UI feels realistic
    const startPoll = () => pollIntervalRef.current = setInterval(async () => {
      const { data, error } = await supabase.functions.invoke('smartid-verify', {
        body: { action: 'poll', sessionId },
      })

      if (error) {
        stopPolling()
        setStep('error')
        setErrorMsg('Klaida tikrinant patvirtinimą. Bandykite dar kartą.')
        return
      }

      if (data?.status === 'verified') {
        stopPolling()
        // Refresh session so user_metadata.verified is up-to-date in the app
        await supabase.auth.refreshSession()
        setStep('success')
        navTimerRef.current = setTimeout(() => navigate('/profile'), 2_000)
        return
      }

      if (data?.status !== 'running') {
        // user_refused, timeout, document_unusable, etc.
        stopPolling()
        setStep('error')
        setErrorMsg('Patvirtinimas atmestas arba nepavyko. Bandykite dar kartą.')
      }
    }, POLL_INTERVAL_MS)

    pollStartRef.current = setTimeout(startPoll, initialDelay)
  }

  function handleRetry() {
    setStep('form')
    setVerificationCode(null)
    setErrorMsg(null)
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="bg-white rounded-xl border border-gray-200 px-8 py-10 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">✓</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tapatybė patvirtinta</h2>
          <p className="text-sm text-gray-500">Nukreipiama į profilį...</p>
        </div>
      </div>
    )
  }

  if (step === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="bg-white rounded-xl border border-gray-200 px-8 py-10 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Patvirtinkite SmartID programėlėje</h2>
          {verificationCode && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Patvirtinimo kodas</p>
              <p className="text-4xl font-bold tracking-widest text-indigo-600">{verificationCode}</p>
              <p className="text-xs text-gray-400 mt-2">Įsitikinkite, kad kodas sutampa su parodytu programėlėje</p>
            </div>
          )}
          <p className="text-sm text-gray-500">Laukiama patvirtinimo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Patvirtinti tapatybę</h1>
      <p className="text-sm text-gray-500 mb-6">
        Patvirtinkite savo tapatybę naudodami SmartID, kad galėtumėte paskelbti bilietus.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Šalis</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value as 'LT' | 'EE' | 'LV')}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="LT">Lietuva (LT)</option>
            <option value="EE">Estija (EE)</option>
            <option value="LV">Latvija (LV)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asmens kodas</label>
          <input
            type="text"
            required
            placeholder="pvz. 38001085718"
            pattern="\d{11}"
            minLength={11}
            maxLength={11}
            title="Asmens kodas turi būti 11 skaitmenų"
            value={personalCode}
            onChange={(e) => setPersonalCode(e.target.value.trim())}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? 'Jungiamasi...' : 'Patvirtinti su SmartID'}
        </button>
      </form>

      {step === 'error' && (
        <button
          onClick={handleRetry}
          className="mt-4 w-full py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm"
        >
          Bandyti dar kartą
        </button>
      )}
    </div>
  )
}
