// Edge Function: admin-users
// Lists all auth users and handles suspend/unsuspend actions.
// Restricted to admin callers only (is_admin in JWT user_metadata).
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set automatically in Edge Functions)

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  // ── 1. Auth guard — admin only ────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401, headers: CORS_HEADERS })
  }

  // Verify the caller's JWT and extract their metadata
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: CORS_HEADERS })
  }

  if (!(user.user_metadata?.is_admin === true)) {
    return new Response('Forbidden', { status: 403, headers: CORS_HEADERS })
  }

  // ── 2. Route by method ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    return handleList()
  }

  if (req.method === 'POST') {
    return handleAction(req)
  }

  return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
})

// ── Handler: list all users ───────────────────────────────────────────────────
async function handleList() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    console.error('Failed to list users:', error)
    return new Response('Failed to list users', { status: 500, headers: CORS_HEADERS })
  }

  // Return only the fields the admin UI needs
  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    banned_until: u.banned_until ?? null,
    is_admin: u.user_metadata?.is_admin === true,
  }))

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ── Handler: suspend or unsuspend a user ─────────────────────────────────────
async function handleAction(req: Request) {
  let body: { action?: string; userId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS })
  }

  const { action, userId } = body

  if (!userId || (action !== 'suspend' && action !== 'unsuspend')) {
    return new Response('Missing or invalid action/userId', { status: 400, headers: CORS_HEADERS })
  }

  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return new Response('Invalid userId format', { status: 400, headers: CORS_HEADERS })
  }

  // ban_duration: '87600h' = 10 years (effectively permanent); 'none' = lift ban
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: action === 'suspend' ? '87600h' : 'none',
  })

  if (error) {
    console.error(`Failed to ${action} user ${userId}:`, error)
    return new Response(`Failed to ${action} user`, { status: 500, headers: CORS_HEADERS })
  }

  return new Response(JSON.stringify({ id: data.user.id, banned_until: data.user.banned_until }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
