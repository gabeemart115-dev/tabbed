'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center max-w-sm">
        <p className="text-white text-lg font-semibold mb-3">Check your email</p>
        <p className="text-zinc-400 text-sm">We sent a sign-in link to <span className="text-white">{email}</span>. Click it to continue.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <input
        className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition"
        placeholder="Your email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}
        className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-40"
      >
        {loading ? 'Sending...' : 'Send Sign-In Link'}
      </button>
    </form>
  )
}
