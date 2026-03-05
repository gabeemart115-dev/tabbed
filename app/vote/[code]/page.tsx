import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VoteForm from './VoteForm'

export default async function VotePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ guest?: string }>
}) {
  const { code } = await params
  const { guest } = await searchParams
  const supabase = await createClient()

  const { data: party } = await supabase
    .from('parties')
    .select('id, name, event_dates, invite_code')
    .eq('invite_code', code)
    .single()

  if (!party) notFound()

  const { data: venues } = await supabase.from('venues').select('*')

  return (
    <main className="min-h-screen bg-black text-white px-6 md:px-12 py-16 max-w-3xl mx-auto">
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Pick Your Spots</p>
      <h1 className="text-3xl font-bold tracking-tight mb-2">{party.name}</h1>
      <p className="text-zinc-400 text-sm mb-10">Rank your top 3 venues for {party.event_dates.join(', ')}</p>
      <VoteForm party={party} venues={venues ?? []} guestId={guest ?? ''} />
    </main>
  )
}
