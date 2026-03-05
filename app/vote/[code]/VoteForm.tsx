'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VoteForm({ party, venues, guestId }: { party: any; venues: any[]; guestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ranked, setRanked] = useState<string[]>([])

  function toggleVote(venueId: string) {
    setRanked(prev => {
      if (prev.includes(venueId)) return prev.filter(id => id !== venueId)
      if (prev.length >= 3) return prev
      return [...prev, venueId]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (ranked.length === 0) return
    setLoading(true)
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ party_id: party.id, guest_id: guestId, ranked }),
    })
    setLoading(false)
    router.push(`/party/${party.invite_code}/confirmed`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3 mb-8">
        {venues.map(venue => {
          const rank = ranked.indexOf(venue.id) + 1
          return (
            <button key={venue.id} type="button" onClick={() => toggleVote(venue.id)}
              className={`w-full flex justify-between items-center px-4 py-4 border text-left transition ${rank > 0 ? 'border-white bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'}`}
            >
              <div>
                <p className="text-sm font-semibold">{venue.name}</p>
                <p className="text-xs text-zinc-500">{venue.neighborhood} · ${venue.min_spend?.toLocaleString()} min</p>
              </div>
              {rank > 0 && (
                <span className="text-xs tracking-widest uppercase text-zinc-400">#{rank}</span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-zinc-600 text-xs mb-4">{ranked.length}/3 selected</p>
      <button type="submit" disabled={loading || ranked.length === 0}
        className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-40"
      >
        {loading ? 'Submitting...' : 'Lock In My Votes'}
      </button>
    </form>
  )
}
