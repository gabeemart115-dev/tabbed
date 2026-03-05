import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const { party_id, venue_id, night_date, headcount, venue_min_spend, invite_code } = body

  const gratuity = Math.round(venue_min_spend * 0.20)
  const service_fee = Math.round(venue_min_spend * 0.12)
  const total_cost = venue_min_spend + gratuity + service_fee
  const per_person_cost = Math.ceil(total_cost / headcount)

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({ party_id, venue_id, night_date, headcount, total_cost, per_person_cost, gratuity })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: guests } = await supabase
    .from('guests')
    .select('id, name, phone, email')
    .eq('party_id', party_id)

  for (const guest of guests ?? []) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Your share — ${night_date}` },
          unit_amount: per_person_cost * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/paid?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/party/${invite_code}`,
      metadata: { booking_id: booking.id, guest_id: guest.id },
    })

    await supabase.from('payments').insert({
      booking_id: booking.id,
      guest_id: guest.id,
      stripe_payment_id: session.id,
      amount: per_person_cost,
      status: 'pending',
    })
  }

  return NextResponse.json({ booking })
}