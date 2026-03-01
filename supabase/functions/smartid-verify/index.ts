// Edge Function: smartid-verify
// Handles SmartID identity verification for sellers (sandbox environment).
// Two actions:
//   initiate — starts a SmartID authentication session, returns sessionId + verificationCode
//   poll     — checks session status; on success, marks seller as verified in profiles table
//
// Sandbox endpoint: https://sid.demo.sk.ee/smart-id-rp/v3
// Requires env secrets: SMARTID_BASE_URL, SMARTID_RELYING_PARTY_UUID, SMARTID_RELYING_PARTY_NAME
// Supabase secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const SMARTID_BASE_URL = Deno.env.get('SMARTID_BASE_URL') ?? 'https://sid.demo.sk.ee/smart-id-rp/v2'
const RELYING_PARTY_UUID = Deno.env.get('SMARTID_RELYING_PARTY_UUID')!
const RELYING_PARTY_NAME = Deno.env.get('SMARTID_RELYING_PARTY_NAME')!

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  // ── 1. Auth guard — must be a logged-in user ──────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401, headers: CORS_HEADERS })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })
  }

  // ── 2. Route by action ────────────────────────────────────────────────────
  let body: { action?: string; personalCode?: string; countryCode?: string; sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS })
  }

  if (body.action === 'initiate') {
    return handleInitiate(body.personalCode, body.countryCode)
  }

  if (body.action === 'poll') {
    return handlePoll(body.sessionId, user.id)
  }

  return new Response('Invalid action', { status: 400, headers: CORS_HEADERS })
})

// ── Shared: mark user as verified in auth metadata + profiles ─────────────────
async function markVerified(userId: string): Promise<string | null> {
  // Update auth user_metadata so refreshSession() picks it up on the frontend
  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { verified: true },
  })
  if (metaError) {
    console.error('Failed to update user_metadata:', metaError)
    return metaError.message
  }

  // Also persist to profiles table for the public Verified badge
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, verified: true, verified_at: new Date().toISOString() })
  if (profileError) {
    // Non-fatal — auth metadata is the source of truth for the gate
    console.error('Failed to update profiles (non-fatal):', profileError)
  }

  return null
}

// ── Handler: initiate SmartID authentication session ─────────────────────────
async function handleInitiate(personalCode?: string, countryCode?: string) {
  if (!personalCode || !countryCode) {
    return new Response('Missing personalCode or countryCode', { status: 400, headers: CORS_HEADERS })
  }

  // Allowlist country code — prevents path traversal in URL interpolation
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return new Response('Invalid countryCode', { status: 400, headers: CORS_HEADERS })
  }

  // Personal codes for LT/LV/EE are 11 digits
  if (!/^\d{11}$/.test(personalCode)) {
    return new Response('Invalid personalCode', { status: 400, headers: CORS_HEADERS })
  }

  // Mock bypass for sandbox testing — personal code 40404040009 auto-approves after polling
  if (personalCode === '40404040009') {
    return new Response(
      JSON.stringify({ sessionId: 'mock_bypass_session', verificationCode: '1234' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  // Generate a random 64-byte challenge, then SHA-256 it to produce the hash.
  // SmartID API requires a base64-encoded SHA-256 hash value.
  const challenge = new Uint8Array(64)
  crypto.getRandomValues(challenge)
  const hashBuffer = await crypto.subtle.digest('SHA-256', challenge)
  const hashBytes = new Uint8Array(hashBuffer)
  const hash = btoa(String.fromCharCode(...hashBytes))

  // Verification code shown on the user's SmartID app:
  // first 2 bytes of the hash interpreted as a 16-bit integer, mod 10000, zero-padded.
  const vcCode = ((hashBytes[0] * 256 + hashBytes[1]) % 10000).toString().padStart(4, '0')

  // SmartID API: POST /authentication/pno/{country}/{nationalIdentityNumber}
  const res = await fetch(
    `${SMARTID_BASE_URL}/authentication/pno/${countryCode}/${personalCode}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relyingPartyUUID: RELYING_PARTY_UUID,
        relyingPartyName: RELYING_PARTY_NAME,
        hash,
        hashType: 'SHA256',
        allowedInteractionsOrder: [
          { type: 'displayTextAndPIN', displayText60: 'Eventis: Patvirtinkite tapatybę' },
        ],
      }),
    },
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error('SmartID initiate error:', res.status, errText)
    return new Response(JSON.stringify({ error: 'SmartID initiation failed', status: res.status, detail: errText }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const data = await res.json()

  return new Response(
    JSON.stringify({ sessionId: data.sessionID, verificationCode: vcCode }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  )
}

// ── Handler: poll session result ──────────────────────────────────────────────
async function handlePoll(sessionId?: string, userId?: string) {
  if (!sessionId || !userId) {
    return new Response('Missing sessionId', { status: 400, headers: CORS_HEADERS })
  }

  // Validate sessionId is a UUID or the known mock value — prevents path traversal
  const isMock = sessionId === 'mock_bypass_session'
  if (!isMock && !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return new Response('Invalid sessionId', { status: 400, headers: CORS_HEADERS })
  }

  // Mock bypass — auto-approve after a short delay
  if (isMock) {
    const verifyError = await markVerified(userId)
    if (verifyError) {
      return new Response('Failed to save verification', { status: 500, headers: CORS_HEADERS })
    }
    return new Response(
      JSON.stringify({ status: 'verified' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  // SmartID API: GET /session/{sessionId}?timeoutMs=5000
  const res = await fetch(
    `${SMARTID_BASE_URL}/session/${sessionId}?timeoutMs=5000`,
    { method: 'GET' },
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error('SmartID poll error:', errText)
    return new Response('SmartID poll failed', { status: 502, headers: CORS_HEADERS })
  }

  const data = await res.json()
  // data.state: 'RUNNING' | 'COMPLETE'
  // data.result.endResult: 'OK' | 'TIMEOUT' | 'USER_REFUSED' | 'DOCUMENT_UNUSABLE'

  if (data.state === 'COMPLETE' && data.result?.endResult === 'OK') {
    const verifyError = await markVerified(userId)
    if (verifyError) {
      return new Response('Failed to save verification', { status: 500, headers: CORS_HEADERS })
    }
    return new Response(
      JSON.stringify({ status: 'verified' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  // Return current state for frontend to continue polling
  const status = data.state === 'RUNNING'
    ? 'running'
    : (data.result?.endResult ?? 'error').toLowerCase()

  return new Response(
    JSON.stringify({ status }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  )
}
