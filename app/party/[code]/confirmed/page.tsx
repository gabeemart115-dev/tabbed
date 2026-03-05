import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ConfirmedPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const supabase = await createClient()
  const { data: party } = await supabase
    .from('parties')
    .select('name, host_name')
    .eq('invite_code', code)
    .single()

  const heading = party ? `VOTES IN — ${party.name}` : 'VOTES IN'
  const hostName = party?.host_name ?? 'Your host'

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">{heading}</h1>
      <p className="text-zinc-400 max-w-sm mb-10">
        Your picks are locked. {hostName} will close voting and reach out to venues. You'll get a text when your night is confirmed and a payment link to lock in your spot.
      </p>
      <Link href={`/party/${code}`} className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition border border-zinc-700 px-6 py-3 hover:border-zinc-400">
        View Party Dashboard →
      </Link>
    </main>
  )
}