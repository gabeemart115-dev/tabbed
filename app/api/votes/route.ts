import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.party_id || !body.guest_id || !Array.isArray(body.ranked) || body.ranked.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const votes = body.ranked.map((venue_id: string, index: number) => ({
    party_id: body.party_id,
    guest_id: body.guest_id,
    venue_id,
    rank: index + 1,
  }))

  const { error } = await supabase.from('votes').insert(votes)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}