'use client'

type VenueResult = {
  name: string
  neighborhood: string
  min_spend: number
  score: number
  votes: number
}

export default function PartyDashboard({ party, venueResults }: { party: any; venueResults: VenueResult[] }) {
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL}/join/${party.invite_code}`

  async function closeVoting() {
    await fetch(`/api/parties/${party.id}/close-voting`, { method: 'POST' })
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">

        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Your Tab</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">{party.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Left: Details + Invite */}
          <div className="space-y-10">
            <section>
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Details</p>
              <div className="space-y-0">
                {[
                  ['Host', party.host_name],
                  ['Headcount', party.headcount],
                  ['Nights', party.event_dates.join(', ')],
                  ['Status', party.status.replace(/_/g, ' ')],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-zinc-800 py-3 text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-white uppercase text-xs tracking-wider font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Invite Code</p>
              <p className="text-3xl font-bold tracking-widest mb-1">{party.invite_code}</p>
              <p className="text-zinc-600 text-xs mb-4">Share so guests can find the party at tabbed.com/find</p>
              <div className="bg-zinc-900 border border-zinc-700 px-4 py-3 text-xs text-zinc-400 break-all mb-2">
                {inviteUrl}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition"
              >
                Copy Invite Link
              </button>
            </section>
          </div>

          {/* Middle: Vote Results */}
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">
              Vote Results ({party.guests?.length ?? 0} voted)
            </p>
            {venueResults.length === 0 ? (
              <p className="text-zinc-600 text-sm">No votes yet. Guests need to vote first.</p>
            ) : (
              <ul className="space-y-0">
                {venueResults.map((v, i) => (
                  <li key={v.name} className="border-b border-zinc-800 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">
                          {i === 0 && <span className="text-yellow-400 mr-2">#1</span>}
                          {i === 1 && <span className="text-zinc-400 mr-2">#2</span>}
                          {i === 2 && <span className="text-zinc-500 mr-2">#3</span>}
                          {i > 2 && <span className="text-zinc-700 mr-2">#{i + 1}</span>}
                          {v.name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">{v.neighborhood} · ${v.min_spend?.toLocaleString()} min</p>
                      </div>
                      <div className="text-right text-xs text-zinc-400">
                        <p>{v.score} pts</p>
                        <p>{v.votes} picks</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {party.status === 'pending_votes' && venueResults.length > 0 && (
              <button onClick={closeVoting}
                className="mt-8 w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
              >
                Close Voting + Send to Venues
              </button>
            )}
          </div>

          {/* Right: Guest List */}
          <div>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">
              Guests ({party.guests?.length ?? 0} joined)
            </p>
            {party.guests?.length === 0 ? (
              <p className="text-zinc-600 text-sm">No guests yet. Share your link.</p>
            ) : (
              <ul className="space-y-0">
                {party.guests?.map((g: any) => (
                  <li key={g.id} className="flex justify-between text-sm border-b border-zinc-800 py-3">
                    <span>{g.name}</span>
                    <span className={g.paid ? 'text-green-400' : 'text-zinc-500'}>
                      {g.paid ? 'Paid' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
