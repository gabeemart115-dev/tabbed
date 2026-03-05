'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinForm({ party }: { party: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const inputClass = "w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 md:py-4 text-sm md:text-base focus:outline-none focus:border-white transition"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, party_id: party.id, invite_code: party.invite_code, party_name: party.name }),
    })
    const data = await res.json()
    if (data.id) {
      router.push(`/vote/${party.invite_code}?guest=${data.id}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <input className={inputClass} placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      <input className={inputClass} placeholder="Your phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
      <input className={inputClass} placeholder="Your email (optional)" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      <button type="submit" disabled={loading}
        className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-40"
      >
        {loading ? 'Joining...' : "I'm In"}
      </button>
    </form>
  )
}