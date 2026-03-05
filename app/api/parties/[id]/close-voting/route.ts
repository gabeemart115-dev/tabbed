import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: votes } = await supabase
    .from('votes')
    .select('venue_id, rank, venues(name, contact_email)')
    .eq('party_id', id)

  if (!votes || votes.length === 0) {
    return NextResponse.json({ error: 'No votes yet' }, { status: 400 })
  }

  const scores: Record<string, { score: number; venue: any }> = {}
  for (const vote of votes) {
    const vid = vote.venue_id
    if (!scores[vid]) scores[vid] = { score: 0, venue: (vote as any).venues }
    scores[vid].score += (4 - vote.rank)
  }

  const top3 = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([venue_id, { venue }]) => ({ venue_id, venue }))

  await supabase.from('venue_requests').insert(
    top3.map(({ venue_id }) => ({ party_id: id, venue_id, status: 'pending' }))
  )

  await supabase.from('parties').update({ status: 'outreach_sent' }).eq('id', id)

  const { data: party } = await supabase
    .from('parties')
    .select('name, host_name, headcount, event_dates, invite_code')
    .eq('id', id)
    .single()

  if (party) {
    const nights = Array.isArray(party.event_dates)
      ? (party.event_dates as string[]).join(', ')
      : party.event_dates

    for (const { venue } of top3) {
      if (!venue?.contact_email) continue
      await resend.emails.send({
        from: 'TABBED <onboarding@resend.dev>',
        to: venue.contact_email,
        subject: `VIP Table Request — ${party.name}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#000;color:#fff;font-family:sans-serif;padding:40px;margin:0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <h1 style="font-size:28px;margin:0 0 8px;">TABBED</h1>
        <p style="color:#888;margin:0 0 32px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">VIP Table Request</p>

        <h2 style="font-size:22px;margin:0 0 24px;">${party.name}</h2>

        <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 16px 4px 0;">Host</td>
            <td style="font-size:14px;">${party.host_name}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 16px 4px 0;">Headcount</td>
            <td style="font-size:14px;">${party.headcount} guests</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 16px 4px 0;">Nights</td>
            <td style="font-size:14px;">${nights}</td>
          </tr>
          <tr>
            <td style="color:#888;font-size:14px;padding:4px 16px 4px 0;">Reference Code</td>
            <td style="font-size:14px;font-family:monospace;">${party.invite_code}</td>
          </tr>
        </table>

        <p style="font-size:15px;line-height:1.6;color:#ccc;">
          Please reply to this email to confirm or decline this table request.<br>
          Use the reference code above when responding.
        </p>

        <p style="color:#555;font-size:12px;margin-top:40px;">Sent via TABBED &mdash; the group nightlife booking platform.</p>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
      })
    }
  }

  return NextResponse.json({ top3 })
}