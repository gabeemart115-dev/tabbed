import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PartyDashboard from './PartyDashboard'

export default async function PartyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: party } = await supabase
    .from('parties')
    .select('*, guests(*), venue_requests(*, venues(*)), bookings(*)')
    .eq('invite_code', code)
    .single()

  if (!party) notFound()

  // Fetch votes with venue names
  const { data: votes } = await supabase
    .from('votes')
    .select('venue_id, rank, venues(name, neighborhood, min_spend)')
    .eq('party_id', party.id)

  // Tally scores: rank 1 = 3pts, rank 2 = 2pts, rank 3 = 1pt
  const scores: Record<string, { name: string; neighborhood: string; min_spend: number; score: number; votes: number }> = {}
  for (const v of votes ?? []) {
    const vid = v.venue_id
    const venue = (v as any).venues
    if (!scores[vid]) scores[vid] = { name: venue.name, neighborhood: venue.neighborhood, min_spend: venue.min_spend, score: 0, votes: 0 }
    scores[vid].score += (4 - v.rank)
    scores[vid].votes += 1
  }
  const venueResults = Object.values(scores).sort((a, b) => b.score - a.score)

  const { data: { user } } = await supabase.auth.getUser()
  const isHost = !!user && user.id === party.host_user_id

  return <PartyDashboard party={party} venueResults={venueResults} isHost={isHost} />
}
