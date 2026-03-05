'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const inputClass = "w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition"

export default function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) {
      setError('Invalid or expired code. Try again.')
      setLoading(false)
    } else {
      router.push(next ?? '/start')
    }
  }

  if (sent) {
    return (
      <form onSubmit={verifyCode} className="w-full max-w-sm space-y-4">
        <p className="text-zinc-400 text-sm text-center">
          Enter the 6-digit code sent to <span className="text-white">{email}</span>
        </p>
        <input
          className={`${inputClass} text-center text-2xl tracking-widest`}
          placeholder="000000"
          value={token}
          onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          required
        />
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <button type="submit" disabled={loading || token.length < 6}
          className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
        <button type="button" onClick={() => { setSent(false); setToken(''); setError('') }}
          className="w-full text-zinc-500 text-xs tracking-widest uppercase hover:text-white transition"
        >
          Use a different email
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="w-full max-w-sm space-y-4">
      <input
        className={inputClass}
        placeholder="Your email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition disabled:opacity-40"
      >
        {loading ? 'Sending...' : 'Send Code'}
      </button>
    </form>
  )
}
