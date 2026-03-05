import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { Resend } from 'resend'
import twilio from 'twilio'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY)

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

    if (guest.email) {
      await resend.emails.send({
        from: 'TABBED <onboarding@resend.dev>',
        to: guest.email,
        subject: `Your payment link — ${night_date}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#000;color:#fff;font-family:sans-serif;padding:40px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <h1 style="font-size:28px;margin:0 0 8px;">TABBED</h1>
        <p style="color:#888;margin:0 0 32px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Your Payment Link</p>

        <h2 style="font-size:22px;margin:0 0 8px;">Hey ${guest.name},</h2>
        <p style="color:#ccc;font-size:15px;margin:0 0 32px;">Your table share for <strong>${night_date}</strong> is ready to pay.</p>

        <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 16px 4px 0;">Night</td>
            <td style="font-size:14px;">${night_date}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 16px 4px 0;">Your share</td>
            <td style="font-size:22px;font-weight:bold;">$${per_person_cost}</td>
          </tr>
        </table>

        <a href="${session.url}" style="display:inline-block;background:#fff;color:#000;font-weight:bold;font-size:16px;padding:16px 40px;text-decoration:none;border-radius:4px;">
          Pay Now
        </a>

        <p style="color:#555;font-size:12px;margin-top:40px;">Sent via TABBED &mdash; the group nightlife booking platform.</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
      })
    }

    if (process.env.TWILIO_ACCOUNT_SID) {
      try {
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        await twilioClient.messages.create({
          body: `TABBED: Your payment link for ${night_date} — $${per_person_cost}/person: ${session.url}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: guest.phone.startsWith('+') ? guest.phone : `+1${guest.phone}`,
        })
      } catch { /* silent fail */ }
    }
  }

  return NextResponse.json({ booking })
}