'use client'

import { useState } from 'react'

type VenueResult = {
  name: string
  neighborhood: string
  min_spend: number
  score: number
  votes: number
}

export default function PartyDashboard({ party, venueResults, isHost }: { party: any; venueResults: VenueResult[]; isHost: boolean }) {
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL}/join/${party.invite_code}`

  const confirmedVenueRequest = party.venue_requests?.find((vr: any) => vr.status === 'confirmed') ?? null
  const hasBooking = party.bookings && party.bookings.length > 0

  const [selectedDate, setSelectedDate] = useState<string>(party.event_dates?.[0] ?? '')
  const [bookingLoading, setBookingLoading] = useState(false)

  async function closeVoting() {
    await fetch(`/api/parties/${party.id}/close-voting`, { method: 'POST' })
    window.location.reload()
  }

  async function markConfirmed(venueRequestId: string) {
    await fetch(`/api/venue-requests/${venueRequestId}/confirm`, { method: 'POST' })
    window.location.reload()
  }

  async function createBooking() {
    if (!confirmedVenueRequest || !selectedDate) return
    setBookingLoading(true)
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        party_id: party.id,
        venue_id: confirmedVenueRequest.venue_id,
        night_date: selectedDate,
        headcount: party.headcount,
        venue_min_spend: confirmedVenueRequest.venues?.min_spend,
        invite_code: party.invite_code,
      }),
    })
    setBookingLoading(false)
    window.location.reload()
  }

  function calcCosts(minSpend: number, headcount: number) {
    const gratuity = minSpend * 0.2
    const serviceFee = minSpend * 0.12
    const total = minSpend + gratuity + serviceFee
    const perPerson = headcount > 0 ? total / headcount : 0
    return { gratuity, serviceFee, total, perPerson }
  }

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return 'bg-green-900 text-green-300'
    if (status === 'declined') return 'bg-red-900 text-red-300'
    return 'bg-zinc-800 text-zinc-400'
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <div className="mb-12">
          <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Your Tab</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">{party.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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

            {isHost && party.status === 'pending_votes' && venueResults.length > 0 && (
              <button onClick={closeVoting}
                className="mt-8 w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
              >
                Close Voting + Send to Venues
              </button>
            )}
          </div>

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

        {/* Booking Flow Section */}
        {!isHost && (
          <div className="mt-10 border-t border-zinc-800 pt-10 text-center">
            <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Host Access</p>
            <a
              href={`/login?next=/party/${party.invite_code}`}
              className="inline-block bg-white text-black px-10 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
            >
              Sign In to Manage
            </a>
          </div>
        )}

        {isHost && (party.status === 'outreach_sent' || party.status === 'booking_confirmed' || confirmedVenueRequest || hasBooking) && (
          <div className="mt-16 border-t border-zinc-800 pt-12">

            {/* Venue Requests — shown when outreach is sent */}
            {party.status === 'outreach_sent' && party.venue_requests?.length > 0 && (
              <section>
                <p className="text-zinc-500 text-xs tracking-widest uppercase mb-6">Venue Responses</p>
                <ul className="space-y-0">
                  {party.venue_requests.map((vr: any) => (
                    <li key={vr.id} className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 py-4 gap-3">
                      <div>
                        <p className="text-sm font-semibold">{vr.venues?.name}</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {vr.venues?.neighborhood}
                          {vr.venues?.min_spend ? ` · $${vr.venues.min_spend.toLocaleString()} min spend` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold ${statusBadge(vr.status)}`}>
                          {vr.status}
                        </span>
                        {vr.status === 'pending' && (
                          <button
                            onClick={() => markConfirmed(vr.id)}
                            className="text-xs tracking-widest uppercase bg-white text-black px-4 py-2 hover:bg-zinc-200 transition font-semibold"
                          >
                            Mark Confirmed
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Booking Creation Form — shown when a venue is confirmed but no booking exists yet */}
            {confirmedVenueRequest && !hasBooking && (
              <section className="mt-12">
                <p className="text-zinc-500 text-xs tracking-widest uppercase mb-6">Create Booking</p>
                <div className="bg-zinc-950 border border-zinc-800 p-8 max-w-lg">
                  <div className="space-y-6">

                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Confirmed Venue</p>
                      <p className="text-white font-semibold">{confirmedVenueRequest.venues?.name}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {confirmedVenueRequest.venues?.neighborhood}
                        {confirmedVenueRequest.venues?.min_spend
                          ? ` · $${confirmedVenueRequest.venues.min_spend.toLocaleString()} min spend`
                          : ''}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Night Date</label>
                      <select
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-zinc-500"
                      >
                        {party.event_dates?.map((date: string) => (
                          <option key={date} value={date}>{date}</option>
                        ))}
                      </select>
                    </div>

                    {confirmedVenueRequest.venues?.min_spend && party.headcount > 0 && (() => {
                      const { gratuity, serviceFee, total, perPerson } = calcCosts(
                        confirmedVenueRequest.venues.min_spend,
                        party.headcount
                      )
                      return (
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Cost Preview</p>
                          <div className="space-y-0">
                            {[
                              ['Min Spend', `$${confirmedVenueRequest.venues.min_spend.toLocaleString()}`],
                              ['Gratuity (20%)', `$${gratuity.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
                              ['Service Fee (12%)', `$${serviceFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
                              ['Total', `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
                              [`Per Person (${party.headcount})`, `$${perPerson.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
                            ].map(([label, value]) => (
                              <div key={label} className="flex justify-between border-b border-zinc-800 py-2 text-sm">
                                <span className="text-zinc-500">{label}</span>
                                <span className={label.startsWith('Per Person') ? 'text-white font-bold' : 'text-white'}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    <button
                      onClick={createBooking}
                      disabled={bookingLoading || !selectedDate}
                      className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? 'Creating...' : 'Create Booking + Send Payment Links'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Confirmed Booking Details — shown when booking exists */}
            {hasBooking && (() => {
              const booking = party.bookings[0]
              const minSpend = booking.venue_min_spend ?? 0
              const headcount = booking.headcount ?? party.headcount ?? 0
              const { gratuity, serviceFee, total, perPerson } = calcCosts(minSpend, headcount)
              return (
                <section className="mt-12">
                  <p className="text-zinc-500 text-xs tracking-widest uppercase mb-6">Confirmed Booking</p>
                  <div className="bg-zinc-950 border border-zinc-800 p-8 max-w-lg">
                    <div className="space-y-0 mb-6">
                      {[
                        ['Venue', confirmedVenueRequest?.venues?.name ?? '—'],
                        ['Date', booking.night_date],
                        ['Headcount', headcount],
                        ['Per Person', `$${perPerson.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
                        ['Total', `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between border-b border-zinc-800 py-3 text-sm">
                          <span className="text-zinc-500">{label}</span>
                          <span className="text-white font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>

                    {party.guests?.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Guest Payment Status</p>
                        <ul className="space-y-0">
                          {party.guests.map((g: any) => (
                            <li key={g.id} className="flex justify-between text-sm border-b border-zinc-800 py-2">
                              <span>{g.name}</span>
                              <span className={g.paid ? 'text-green-400' : 'text-zinc-500'}>
                                {g.paid ? 'Paid' : 'Pending'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )
            })()}

          </div>
        )}

      </div>
    </main>
  )
}