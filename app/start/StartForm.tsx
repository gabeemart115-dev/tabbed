'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NIGHTS = ['Thursday', 'Friday', 'Saturday']

export default function StartForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    host_name: '',
    host_email: '',
    host_phone: '',
    headcount: '',
    event_dates: [] as string[],
  })

  function toggleDate(night: string) {
    setForm(f => ({
      ...f,
      event_dates: f.event_dates.includes(night)
        ? f.event_dates.filter(d => d !== night)
        : [...f.event_dates, night],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.invite_code) {
      router.push(`/party/${data.invite_code}`)
    }
    setLoading(false)
  }

  const inputClass = "w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 md:py-4 text-sm md:text-base focus:outline-none focus:border-white transition"

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
      <input className={inputClass} placeholder="Party name (e.g. Mia's 25th)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      <input className={inputClass} placeholder="Your name" value={form.host_name} onChange={e => setForm(f => ({ ...f, host_name: e.target.value }))} required />
      <input className={inputClass} placeholder="Your email" type="email" value={form.host_email} onChange={e => setForm(f => ({ ...f, host_email: e.target.value }))} required />
      <input className={inputClass} placeholder="Your phone (e.g. 8431234567)" value={form.host_phone} onChange={e => setForm(f => ({ ...f, host_phone: e.target.value }))} required />
      <input className={inputClass} placeholder="How many people?" type="number" min="2" value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))} required />
      <div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-3">Which nights?</p>
        <div className="flex gap-3">
          {NIGHTS.map(night => (
            <button key={night} type="button"
              onClick={() => toggleDate(night)}
              className={`flex-1 py-3 text-xs tracking-widest uppercase border transition ${form.event_dates.includes(night) ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-400'}`}
            >
              {night.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading || form.event_dates.length === 0}
        className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-40"
      >
        {loading ? 'Creating...' : "Let's Go"}
      </button>
    </form>
  )
}
