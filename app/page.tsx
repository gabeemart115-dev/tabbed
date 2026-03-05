import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-4">TABBED</h1>
      <p className="text-zinc-400 text-xl md:text-2xl mb-12 text-center max-w-xl">
        Group nightlife, handled. Book the table. Split the bill. Live the weekend.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/start"
          className="bg-white text-black px-10 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition text-center"
        >
          Start a Tab
        </Link>
        <Link
          href="/find"
          className="border border-zinc-700 text-zinc-400 px-10 py-4 text-sm font-semibold tracking-widest uppercase hover:border-zinc-400 hover:text-white transition text-center"
        >
          Find My Tab
        </Link>
      </div>
    </main>
  )
}
