import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JoinForm from './JoinForm'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data: party } = await supabase
    .from('parties')
    .select('id, name, host_name, event_dates, headcount, invite_code')
    .eq('invite_code', code)
    .single()

  if (!party) notFound()
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">You're invited</p>
      <h1 className="text-4xl font-bold tracking-tight mb-2">{party.name}</h1>
      <p className="text-zinc-400 text-sm mb-10">Hosted by {party.host_name} · {party.event_dates.join(', ')}</p>
      <JoinForm party={party} />
    </main>
  )
}
