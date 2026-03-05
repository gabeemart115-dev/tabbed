import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('guests')
    .insert({
      party_id: body.party_id,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      const voteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/vote/${body.invite_code}?guest=${data.id}`
      await client.messages.create({
        body: `You're in for ${body.party_name ?? 'the party'}. Vote on venues here: ${voteUrl}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: body.phone.startsWith('+') ? body.phone : `+1${body.phone}`,
      })
    } catch {
      // SMS failed silently
    }
  }

  return NextResponse.json(data)
}