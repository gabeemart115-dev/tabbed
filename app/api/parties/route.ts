import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/utils'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const invite_code = generateInviteCode()

  const { data, error } = await supabase
    .from('parties')
    .insert({
      name: body.name,
      host_name: body.host_name,
      host_email: body.host_email,
      host_phone: body.host_phone,
      headcount: parseInt(body.headcount),
      event_dates: body.event_dates,
      invite_code,
      status: 'pending_votes',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const partyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/party/${invite_code}`
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/join/${invite_code}`

  await resend.emails.send({
    from: 'TABBED <onboarding@resend.dev>',
    to: body.host_email,
    subject: `Your tab is open — ${body.name}`,
    html: `
      <div style="background:#000;color:#fff;font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;">
        <h1 style="font-size:32px;font-weight:bold;letter-spacing:-1px;margin-bottom:8px;">TABBED</h1>
        <p style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:4px;margin-bottom:32px;">Your tab is open</p>
        <h2 style="font-size:22px;font-weight:bold;margin-bottom:4px;">${body.name}</h2>
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:32px;">${body.event_dates.join(', ')} · ${body.headcount} people</p>
        <p style="color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;">Your invite code</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin-bottom:32px;">${invite_code}</p>
        <a href="${partyUrl}" style="display:block;background:#fff;color:#000;text-align:center;padding:14px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;text-decoration:none;margin-bottom:12px;">View Your Dashboard</a>
        <a href="${inviteUrl}" style="display:block;border:1px solid #3f3f46;color:#a1a1aa;text-align:center;padding:14px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:4px;text-decoration:none;">Share Invite Link</a>
        <p style="color:#52525b;font-size:11px;margin-top:40px;">Bookmark this email — it's how you get back to your tab.</p>
      </div>
    `,
  })

  return NextResponse.json(data)
}