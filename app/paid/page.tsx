import { createClient } from '@/lib/supabase/server'

export default async function PaidPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const { session } = await searchParams

  let payment = null
  if (session) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('payments')
      .select('*, bookings(*, venues(name, neighborhood)), guests(name)')
      .eq('stripe_payment_id', session)
      .single()
    payment = data
  }

  if (!payment) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">YOU'RE IN</h1>
        <p className="text-zinc-400 max-w-sm">Payment confirmed. Check your phone for your itinerary. See you this weekend.</p>
      </main>
    )
  }

  const guestName = payment.guests?.name
  const venueName = payment.bookings?.venues?.name
  const neighborhood = payment.bookings?.venues?.neighborhood
  const nightDate = payment.bookings?.date
    ? new Date(payment.bookings.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null
  const amountPaid = payment.amount != null
    ? `$${(payment.amount / 100).toFixed(2)}`
    : null

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-6">YOU'RE IN</h1>
      <div className="flex flex-col gap-2 text-zinc-300 max-w-sm mb-10">
        {guestName && <p className="text-xl font-semibold text-white">{guestName}</p>}
        {venueName && (
          <p className="text-lg">
            {venueName}{neighborhood ? ` · ${neighborhood}` : ''}
          </p>
        )}
        {nightDate && <p className="text-zinc-400">{nightDate}</p>}
        {amountPaid && <p className="text-zinc-400">Paid {amountPaid}</p>}
      </div>
      <p className="text-zinc-500 text-sm tracking-wide">See you this weekend.</p>
    </main>
  )
}