'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FindPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(`/api/parties/find?code=${code.trim().toUpperCase()}`)
    if (res.ok) {
      router.push(`/party/${code.trim().toUpperCase()}`)
    } else {
      setError('No party found with that code.')
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h2 className="text-3xl font-bold tracking-tight mb-2">FIND YOUR TAB</h2>
      <p className="text-zinc-500 mb-10 text-sm tracking-widest uppercase">Enter your invite code</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-4 text-lg tracking-widest uppercase text-center focus:outline-none focus:border-white transition"
          placeholder="XXXXXXXX"
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          maxLength={8}
          required
        />
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <button type="submit"
          className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
        >
          Find My Tab
        </button>
      </form>
    </main>
  )
}