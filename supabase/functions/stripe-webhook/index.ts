// Edge Function: stripe-webhook
// Fulfills an order after Stripe confirms payment:
//   1. Marks order as 'paid' (idempotent — skips steps 2–5 on Stripe retries)
//   2. Marks ticket as 'sold'
//   3. Creates a pending payout record for the seller
//   4. Emails buyer a signed PDF download link via Resend
// Also handles checkout.session.expired to release ticket reservations.
// Requires: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
//           SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY (set in Supabase dashboard)

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  // Only Stripe POSTs to this endpoint
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return new Response('Missing stripe-signature', { status: 400 })
  }
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

  // ── 1. Verify webhook signature ──────────────────────────────────────────
  // Stripe's Node SDK uses crypto APIs compatible with Deno's Web Crypto.
  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature invalid', { status: 400 })
  }

  // ── 2. Route by event type ────────────────────────────────────────────────
  if (event.type === 'checkout.session.expired') {
    return handleSessionExpired(event.data.object as Stripe.Checkout.Session)
  }

  if (event.type === 'checkout.session.completed') {
    return handleSessionCompleted(event.data.object as Stripe.Checkout.Session)
  }

  // Acknowledge any other event types without processing
  return new Response(JSON.stringify({ received: true }), { status: 200 })
})

// ── Handler: session expired ──────────────────────────────────────────────────
// Releases the ticket reservation so the listing becomes available again.
async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const { ticket_id } = session.metadata ?? {}
  if (!ticket_id) {
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  await supabaseAdmin.rpc('unreserve_ticket', { p_ticket_id: ticket_id })

  // Remove the stale pending order (no payment was taken)
  await supabaseAdmin
    .from('orders')
    .delete()
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}

// ── Handler: session completed ────────────────────────────────────────────────
async function handleSessionCompleted(session: Stripe.Checkout.Session) {
  const { ticket_id, buyer_id } = session.metadata ?? {}

  if (!ticket_id || !buyer_id) {
    console.error('Missing metadata in session:', session.id)
    return new Response('Missing metadata', { status: 400 })
  }

  // ── 3. Mark order as paid — filter by 'pending' for idempotency ──────────
  // If Stripe retries this webhook, the order is already 'paid' so the UPDATE
  // matches 0 rows and markedOrder is null. We return early without re-sending
  // the email, preventing duplicate delivery.
  const { data: markedOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'paid' })
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')
    .select('id, amount_paid')
    .maybeSingle()

  if (orderError) {
    console.error('Failed to update order:', orderError)
    return new Response('Failed to update order', { status: 500 })
  }

  if (!markedOrder) {
    // Already processed by a previous webhook delivery — safe to acknowledge
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  // ── 4. Mark ticket as sold ───────────────────────────────────────────────
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('tickets')
    .update({ status: 'sold' })
    .eq('id', ticket_id)
    .select('ticket_file_url, seller_id')
    .single()

  if (ticketError) {
    console.error('Failed to update ticket:', ticketError)
    return new Response('Failed to update ticket', { status: 500 })
  }

  // ── 5. Create payout record for seller ──────────────────────────────────
  const { error: payoutError } = await supabaseAdmin
    .from('payouts')
    .insert({
      order_id: markedOrder.id,
      seller_id: ticket.seller_id,
      amount: markedOrder.amount_paid,
      status: 'pending',
    })

  if (payoutError) {
    // Non-fatal — order + ticket are already updated; log for manual recovery
    console.error('Failed to create payout:', payoutError)
  }

  // ── 6. Email buyer with PDF download link ─────────────────────────────────
  // Retrieve buyer's email from Supabase Auth
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(buyer_id)
  if (userError || !user?.email) {
    console.error('Failed to fetch buyer email:', userError)
    // Non-fatal — order + ticket are already updated; log and move on
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  }

  // Generate a 1-hour signed URL for the PDF if one was uploaded
  let pdfLine = ''
  if (ticket?.ticket_file_url) {
    const { data: signedData, error: signedError } = await supabaseAdmin
      .storage
      .from('ticket-pdfs')
      .createSignedUrl(ticket.ticket_file_url, 3600) // 1 hour

    if (!signedError && signedData?.signedUrl) {
      pdfLine = `<p>Atsisiųskite bilieto PDF: <a href="${signedData.signedUrl}">Atsisiųsti</a> (nuoroda galioja 1 val.)</p>`
    }
  }

  // Send email via Resend HTTP API (no SDK needed in Deno)
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Eventis <bilietai@eventis.lt>',
      to: [user.email],
      subject: 'Jūsų bilietas — Eventis',
      html: `
        <h2>Ačiū už pirkinį!</h2>
        <p>Jūsų apmokėjimas patvirtintas. Bilietas rezervuotas jūsų vardu.</p>
        ${pdfLine}
        <p>Užsakymų istoriją galite peržiūrėti <a href="${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/my-orders">čia</a>.</p>
      `,
    }),
  })

  if (!resendRes.ok) {
    const errText = await resendRes.text()
    console.error('Resend API error:', errText)
    // Non-fatal — order is fulfilled even if email fails
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}
