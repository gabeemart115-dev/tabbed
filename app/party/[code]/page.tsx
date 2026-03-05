import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PartyDashboard from './PartyDashboard'

export default async function PartyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: party } = await supabase
    .from('parties')
    .select('*, guests(*), venue_requests(*, venues(*))')
    .eq('invite_code', code)
    .single()

  if (!party) notFound()

  const { data: votes } = await supabase
    .from('votes')
    .select('venue_id, rank, venues(name, neighborhood, min_spend)')
    .eq('party_id', party.id)

  const scores: Record<string, { name: string; neighborhood: string; min_spend: number; score: number; votes: number }> = {}
  for (const v of votes ?? []) {
    const vid = v.venue_id
    const venue = (v as any).venues
    if (!scores[vid]) scores[vid] = { name: venue.name, neighborhood: venue.neighborhood, min_spend: venue.min_spend, score: 0, votes: 0 }
    scores[vid].score += (4 - v.rank)
    scores[vid].votes += 1
  }
  const venueResults = Object.values(scores).sort((a, b) => b.score - a.score)

  return <PartyDashboard party={party} venueResults={venueResults} />
}