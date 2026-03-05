import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  // Score: rank 1 = 3pts, rank 2 = 2pts, rank 3 = 1pt
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

  return NextResponse.json({ top3 })
}
