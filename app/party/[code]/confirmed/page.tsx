import Link from 'next/link'

export default async function ConfirmedPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">VOTES IN</h1>
      <p className="text-zinc-400 max-w-sm mb-10">Your picks are locked. We'll reach out to the top venues and confirm your night. Watch for a text.</p>
      <Link href={`/party/${code}`} className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition border border-zinc-700 px-6 py-3 hover:border-zinc-400">
        Back to Party Dashboard
      </Link>
    </main>
  )
}