# Tabbed — Tech Stack Design
**Date:** 2026-03-04
**Status:** Approved

---

## Overview

Tabbed is a nightlife planning and VIP table booking platform. A group organizer starts a "tab," invites friends to vote on venues, the platform handles venue outreach, and everyone pays their split automatically.

MVP targets Charleston, SC. Built entirely through AI-assisted coding.

---

## Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | AI knows this stack better than any other; clean, fast to build |
| Hosting | Vercel | One-click deploys, free tier, works natively with Next.js |
| Database + Auth | Supabase | PostgreSQL, built-in auth, real-time, well-documented for AI coding |
| Automation | Make (Integromat) | Visual workflows, no-code automation for venue emails + payment triggers |
| Payments | Stripe | AI can wire up Checkout/Payment Links quickly; handles splits + fees |
| Email | Resend | Simple API, AI-friendly integration |
| SMS | Twilio | Industry standard for group notifications |

---

## Core Data Model

**parties** — a "tab" created by a host
- id, name, host_id, event_dates (Thurs–Sat), status, created_at

**guests** — people invited to a party
- id, party_id, name, phone, email, joined_at, paid (bool)

**votes** — venue preferences per guest
- id, guest_id, party_id, venue_id, rank

**venues** — Charleston club/lounge directory
- id, name, contact_email, capacity, nights_available

**venue_requests** — outreach sent to clubs
- id, party_id, venue_id, status (pending/confirmed/declined), sent_at, confirmed_at

**bookings** — confirmed booking
- id, party_id, venue_id, night_date, headcount, total_cost, per_person_cost, gratuity

**payments** — per-guest payment record
- id, booking_id, guest_id, stripe_payment_id, amount, status, paid_at

---

## Core User Flows

### Flow 1: Start a Tab (Host)
1. Host lands on tabbed.com → clicks "Start a Tab"
2. Enters: party name, dates (Thurs/Fri/Sat), headcount, their phone/email
3. Receives a unique party link to share with friends
4. Party created in Supabase with status = `pending_votes`

### Flow 2: Join + Vote (Guests)
1. Guest opens invite link → enters their name + phone
2. Sees list of available Charleston venues → ranks top 3 choices
3. Vote saved to Supabase
4. Once all guests voted (or host closes voting), system tallies top 2–3 venues

### Flow 3: Venue Outreach (Automated via Make)
1. Make trigger: voting closes → top venues selected
2. Make sends templated email to each venue's contact
3. Venue replies or clicks a confirmation link
4. Make updates venue_request status → notifies host via SMS

### Flow 4: Booking + Payment (Automated via Make + Stripe)
1. Host confirms venue choice
2. Make calculates per-person cost (venue min spend + 12% service fee + 20% gratuity)
3. Stripe Checkout session created per guest
4. Make sends individual Stripe payment links to each guest via SMS
5. Payments tracked in Supabase; host sees live payment status dashboard

### Flow 5: Party Dashboard
- Host + guests access shared dashboard via party link
- Shows: confirmed venue, itinerary, addresses, payment status per person, receipts

---

## Make Automation Flows

1. **Voting closed → venue outreach email** — triggers when host closes voting
2. **Venue confirmed → notify host** — triggers on venue_request status update
3. **Booking locked → Stripe links to guests** — triggers on booking creation
4. **Guest paid → update dashboard + confirm** — triggers on Stripe webhook
5. **Day-of reminders** — scheduled trigger 24hrs before event date

---

## Revenue Model (Encoded in Stripe)

- 12% service fee added to each guest's payment
- 20% gratuity pre-calculated and included
- Stripe collects all funds; Tabbed receives service fee portion via Stripe Connect

---

## MVP Scope (Charleston launch)

In scope:
- Tab creation flow
- Guest invite + voting
- Manual venue directory (10–15 Charleston clubs)
- Make automation for venue outreach + payment links
- Stripe payment splitting
- Party dashboard (web, mobile-responsive)

Out of scope for MVP:
- Native mobile app
- AI itinerary suggestions
- Loyalty/rewards system
- Multi-city expansion
- Sober experiences vertical

---

## Build Order

1. Set up Next.js project + Supabase + Vercel
2. Build tab creation form + party dashboard shell
3. Build guest invite + voting flow
4. Load Charleston venue directory into Supabase
5. Wire Make automation: voting → venue email
6. Wire Make automation: booking confirmed → Stripe links
7. Wire Stripe payments + webhook
8. Polish UI + mobile responsiveness
9. Internal testing with real Charleston bookings
10. Public launch
