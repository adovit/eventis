# User Personas — Eventis

**Last updated**: 2026-02-28

---

## Persona 1 — The Stranded Seller

**Name**: Marius, 28
**Location**: Vilnius
**Occupation**: Software engineer

### Context
Bought 2 Žalgiris playoff tickets 3 months ago. Business trip came up — can't go. Tried Facebook Marketplace last time, got ghosted twice and then scammed once. Lost €80.

### Goals
- Get his money back quickly
- Not deal with strangers meeting up
- Simple listing process (5 minutes max)

### Frustrations
- Facebook: no payment guarantee, time-wasters
- Friends "will pay you back" — they don't
- No LT platform for this specifically

### How he uses Eventis
1. Finds his event via search
2. Uploads PDF ticket, sets price
3. Waits for buyer
4. Gets Stripe payout after event

### Key concerns
- "Will I actually get paid?"
- "What if the buyer claims the ticket was fake?"
- "How long until I get the money?"

---

## Persona 2 — The Last-Minute Buyer

**Name**: Kotryna, 24
**Location**: Kaunas
**Occupation**: Marketing coordinator

### Context
Her favourite band just announced they're playing Kaunas. Primary tickets sold out in 10 minutes. Now scrolling Facebook groups with 3 different sellers all asking 3x the original price, no proof of legitimacy.

### Goals
- Get a real ticket (not a scam)
- Know what she's paying upfront (no hidden fees)
- Receive the ticket digitally

### Frustrations
- Facebook: can't tell if seller is legit
- Viagogo: Lithuanian events not listed, prices in EUR + 30% fees
- Fear of paying and getting nothing

### How she uses Eventis
1. Searches for the event by name
2. Sees all available tickets with prices
3. Pays via Stripe
4. Receives PDF by email

### Key concerns
- "Is this ticket real?"
- "What if the seller already sold it to someone else?"
- "What do I do if something goes wrong?"

---

## Persona 3 — The Admin Operator

**Name**: Adomas (founder)
**Role**: Product owner + marketplace operator

### Context
Running the marketplace solo. Needs to monitor listings, handle edge cases, process payouts, and ensure no fraud slips through.

### Goals
- Operational oversight without a full support team
- Fast payout processing for sellers
- Ability to intervene in disputes
- Low support volume (good UX prevents tickets)

### How he uses Eventis
- `/admin/payouts` — marks payouts as sent after Stripe transfer
- Reviews listings manually (Phase 2: automated)
- Handles edge case disputes via email

### Key concerns
- "Are sellers uploading real PDFs?"
- "Is any buyer complaining about not receiving their ticket?"
- "Is the Stripe webhook running correctly?"

---

## Persona 4 — The Casual Browser (Future)

**Name**: Tomas, 35
**Location**: Klaipėda
**Occupation**: Teacher

### Context
Doesn't actively look for secondary tickets but discovers Eventis while Googling "Žalgiris bilietai". Might buy opportunistically if price is right.

### Goals
- Discover upcoming events near him
- Find a deal if primary is sold out or expensive

### Key needs (for Iteration 5+)
- Good SEO / event discovery
- Price comparison vs primary
- Email alerts for events he follows
