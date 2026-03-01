// Edge Function: create-checkout
// Creates a Stripe Checkout Session for a ticket purchase and inserts a pending order.
// Requires: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (set in Supabase dashboard)

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

// Lazy singleton — avoids Stripe constructor running at module scope before
// secrets are available, which would crash the cold start before Deno.serve().
let stripeClient: Stripe | null = null
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })
  }
  return stripeClient
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // ── 1. Verify caller JWT and extract buyer identity ──────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorised' }, 401)
    }
    const jwt = authHeader.slice(7)

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    if (userError || !user) {
      return json({ error: 'Unauthorised' }, 401)
    }
    const buyerId = user.id
    const buyerEmail = user.email!

    // ── 2. Parse request body ────────────────────────────────────────────────
    const { ticket_id } = await req.json()
    if (!ticket_id) {
      return json({ error: 'ticket_id is required' }, 400)
    }

    // ── 3. Fetch ticket + event details ──────────────────────────────────────
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, price, seller_id, event_id, events(id, title, slug)')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      return json({ error: 'Ticket not found' }, 404)
    }
    // Guard: null events join means orphaned ticket (event deleted)
    if (!ticket.events) {
      return json({ error: 'Event not found' }, 404)
    }
    // Give sellers a clear error rather than the generic "no longer available"
    if (ticket.seller_id === buyerId) {
      return json({ error: 'Cannot purchase your own ticket' }, 400)
    }

    // ── 4. Atomically reserve the ticket ─────────────────────────────────────
    // The reserve_ticket RPC does UPDATE … WHERE status = 'active' in a single
    // statement, preventing two concurrent buyers from both passing the check.
    const { data: reserved, error: reserveError } = await supabaseAdmin
      .rpc('reserve_ticket', { p_ticket_id: ticket_id, p_buyer_id: buyerId })

    if (reserveError) {
      console.error('reserve_ticket RPC error:', reserveError)
      return json({ error: 'Internal server error' }, 500)
    }
    if (!reserved) {
      return json({ error: 'Ticket is no longer available' }, 409)
    }

    const event = ticket.events as { id: string; title: string; slug: string }
    const origin = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

    // ── 5. Create Stripe Checkout Session ────────────────────────────────────
    let session: Stripe.Checkout.Session
    try {
      session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        customer_email: buyerEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: Math.round(ticket.price * 100), // Stripe expects cents
              product_data: {
                name: event.title,
                description: `Bilietas — ${event.title}`,
              },
            },
          },
        ],
        // {CHECKOUT_SESSION_ID} is a Stripe template literal, not a JS variable
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/events/${event.slug}`,
        // expires_after_seconds default is 30 min; webhook handles expiry to unreserve
        metadata: {
          ticket_id: ticket.id,
          event_id: event.id,
          buyer_id: buyerId,
        },
      })
    } catch (stripeErr) {
      // Release the reservation so the ticket becomes available again
      await supabaseAdmin.rpc('unreserve_ticket', { p_ticket_id: ticket_id })
      console.error('Stripe session creation failed:', stripeErr)
      return json({ error: 'Failed to create checkout session' }, 500)
    }

    // ── 6. Insert pending order ───────────────────────────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from('orders')
      .insert({
        ticket_id: ticket.id,
        event_id: event.id,
        buyer_id: buyerId,
        stripe_session_id: session.id,
        amount_paid: ticket.price,
        status: 'pending',
      })

    if (insertError) {
      // Release the reservation so the ticket doesn't get stuck as 'reserved'
      await supabaseAdmin.rpc('unreserve_ticket', { p_ticket_id: ticket_id })
      console.error('Failed to insert order:', insertError)
      return json({ error: 'Failed to create order' }, 500)
    }

    return json({ url: session.url })
  } catch (err) {
    console.error('create-checkout error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
