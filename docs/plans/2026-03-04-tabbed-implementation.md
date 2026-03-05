# TABBED — IMPLEMENTATION PLAN

> **For Claude:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full web platform where groups plan nightlife, vote on venues, and split payments automatically.

**Architecture:** Next.js frontend hosted on Vercel, Supabase as the database and auth layer, Make for no-code automation, and Stripe for payments. All code is written through AI assistance.

**Tech Stack:** Next.js 14 · Tailwind CSS · Supabase · Stripe · Make · Resend · Twilio · Vercel

---

---

## PART I — FOUNDATION

---

### Task 1: Create Your Accounts

No code. Just setup.

**Step 1** — Create accounts at each of these services:

```
vercel.com          free tier
supabase.com        free tier
stripe.com          free tier
make.com            free tier
resend.com          free tier
twilio.com          trial account
```

**Step 2** — Keep a notes file open. Every time a service gives you an API key, paste it there. You will need these in Task 4.

---

### Task 2: Initialize the Project

**Files:**
- Create: `tabbed/` (project root)

**Step 1** — Open Terminal. Run:

```bash
npx create-next-app@latest tabbed --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

When prompted, accept all defaults.

**Step 2** — Move into the project:

```bash
cd tabbed
```

**Step 3** — Install dependencies:

```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js resend twilio
```

**Step 4** — Verify it works:

```bash
npm run dev
```

Open `http://localhost:3000`. You should see the default Next.js homepage.

**Step 5** — Commit:

```bash
git add .
git commit -m "feat: initialize tabbed project"
```

---

### Task 3: Set Up Supabase Database

**Step 1** — Go to supabase.com → New Project → name it `tabbed`

**Step 2** — Open the SQL Editor in Supabase. Run this schema:

```sql
-- PARTIES
create table parties (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  host_name text not null,
  host_email text not null,
  host_phone text not null,
  event_dates text[] not null,
  headcount int not null,
  status text default 'pending_votes',
  invite_code text unique not null,
  created_at timestamptz default now()
);

-- GUESTS
create table guests (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references parties(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  paid boolean default false,
  joined_at timestamptz default now()
);

-- VENUES
create table venues (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_email text not null,
  capacity int,
  min_spend int,
  nights_available text[],
  neighborhood text,
  image_url text
);

-- VOTES
create table votes (
  id uuid default gen_random_uuid() primary key,
  guest_id uuid references guests(id) on delete cascade,
  party_id uuid references parties(id) on delete cascade,
  venue_id uuid references venues(id) on delete cascade,
  rank int not null
);

-- VENUE REQUESTS
create table venue_requests (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references parties(id) on delete cascade,
  venue_id uuid references venues(id) on delete cascade,
  status text default 'pending',
  sent_at timestamptz default now(),
  confirmed_at timestamptz
);

-- BOOKINGS
create table bookings (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references parties(id) on delete cascade,
  venue_id uuid references venues(id) on delete cascade,
  night_date text not null,
  headcount int not null,
  total_cost int not null,
  per_person_cost int not null,
  gratuity int not null,
  created_at timestamptz default now()
);

-- PAYMENTS
create table payments (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete cascade,
  guest_id uuid references guests(id) on delete cascade,
  stripe_payment_id text,
  amount int not null,
  status text default 'pending',
  paid_at timestamptz
);
```

**Step 3** — Verify: all 7 tables appear in the Table Editor.

---

### Task 4: Connect Supabase to the Project

**Files:**
- Create: `.env.local`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

**Step 1** — In Supabase: Settings → API → copy `Project URL` and `anon public` key.

**Step 2** — Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=placeholder_for_now

RESEND_API_KEY=your_resend_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Step 3** — Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 4** — Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Step 5** — Restart dev server. No errors = success.

**Step 6** — Commit:

```bash
git add .
git commit -m "feat: connect supabase"
```

---

### Task 5: Deploy to Vercel

**Step 1** — Push to GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tabbed.git
git push -u origin main
```

**Step 2** — Go to vercel.com → Import Project → select your GitHub repo.

**Step 3** — In Vercel's environment variables section, add every variable from your `.env.local`.

**Step 4** — Deploy. Visit the live URL. Should show the default Next.js page.

**Step 5** — Update `NEXT_PUBLIC_BASE_URL` in Vercel env vars to your live Vercel URL.

---

---

## PART II — THE TAB

---

### Task 6: Landing Page

**Files:**
- Modify: `app/page.tsx`
- Create: `app/globals.css` (already exists, modify)

**Step 1** — Replace `app/page.tsx` with:

```typescript
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-6xl font-bold tracking-tight mb-4">TABBED</h1>
      <p className="text-zinc-400 text-xl mb-12 text-center max-w-md">
        Group nightlife, handled. Book the table. Split the bill. Live the weekend.
      </p>
      <Link
        href="/start"
        className="bg-white text-black px-10 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
      >
        Start a Tab
      </Link>
    </main>
  )
}
```

**Step 2** — Open `http://localhost:3000`. Should show a dark landing page with "TABBED" and a button.

---

### Task 7: Tab Creation Form

**Files:**
- Create: `app/start/page.tsx`
- Create: `app/start/StartForm.tsx`

**Step 1** — Create `app/start/page.tsx`:

```typescript
import StartForm from './StartForm'

export default function StartPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h2 className="text-3xl font-bold tracking-tight mb-2">START YOUR TAB</h2>
      <p className="text-zinc-500 mb-10 text-sm tracking-widest uppercase">Tell us about your night</p>
      <StartForm />
    </main>
  )
}
```

**Step 2** — Create `app/start/StartForm.tsx`:

```typescript
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

  const inputClass = "w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition"

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
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
```

---

### Task 8: Party Creation API

**Files:**
- Create: `app/api/parties/route.ts`
- Create: `lib/utils.ts`

**Step 1** — Create `lib/utils.ts`:

```typescript
export function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

**Step 2** — Create `app/api/parties/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const invite_code = generateInviteCode()

  const { data, error } = await supabase
    .from('parties')
    .insert({
      name: body.name,
      host_name: body.host_name,
      host_email: body.host_email,
      host_phone: body.host_phone,
      headcount: parseInt(body.headcount),
      event_dates: body.event_dates,
      invite_code,
      status: 'pending_votes',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

**Step 3** — Test: fill out the Start form and submit. Should redirect to `/party/[INVITE_CODE]` (page doesn't exist yet — a 404 is fine for now).

**Step 4** — Verify in Supabase Table Editor: a new row appears in the `parties` table.

**Step 5** — Commit:

```bash
git add .
git commit -m "feat: tab creation form and API"
```

---

---

## PART III — THE GUESTS

---

### Task 9: Party Dashboard + Invite Page

**Files:**
- Create: `app/party/[code]/page.tsx`
- Create: `app/party/[code]/PartyDashboard.tsx`

**Step 1** — Create `app/party/[code]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PartyDashboard from './PartyDashboard'

export default async function PartyPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()
  const { data: party } = await supabase
    .from('parties')
    .select('*, guests(*), venue_requests(*, venues(*))')
    .eq('invite_code', params.code)
    .single()

  if (!party) notFound()
  return <PartyDashboard party={party} />
}
```

**Step 2** — Create `app/party/[code]/PartyDashboard.tsx`:

```typescript
'use client'

export default function PartyDashboard({ party }: { party: any }) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/join/${party.invite_code}`

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 max-w-xl mx-auto">
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Your Tab</p>
      <h1 className="text-4xl font-bold tracking-tight mb-8">{party.name}</h1>

      <section className="mb-10">
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Details</p>
        <div className="space-y-2 text-sm text-zinc-300">
          <p>Host: {party.host_name}</p>
          <p>Headcount: {party.headcount}</p>
          <p>Nights: {party.event_dates.join(', ')}</p>
          <p>Status: <span className="text-white font-semibold uppercase text-xs tracking-wider">{party.status.replace('_', ' ')}</span></p>
        </div>
      </section>

      <section className="mb-10">
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">Invite Link</p>
        <div className="bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-zinc-300 break-all">
          {inviteUrl}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(inviteUrl)}
          className="mt-3 text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition"
        >
          Copy Link
        </button>
      </section>

      <section>
        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-4">
          Guests ({party.guests?.length ?? 0} joined)
        </p>
        {party.guests?.length === 0 && (
          <p className="text-zinc-600 text-sm">No guests yet. Share your link.</p>
        )}
        <ul className="space-y-2">
          {party.guests?.map((g: any) => (
            <li key={g.id} className="flex justify-between text-sm border-b border-zinc-800 pb-2">
              <span>{g.name}</span>
              <span className={g.paid ? 'text-green-400' : 'text-zinc-500'}>
                {g.paid ? 'Paid' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

**Step 3** — Visit your party URL. Should display the party name, invite link, and empty guest list.

---

### Task 10: Guest Join Flow

**Files:**
- Create: `app/join/[code]/page.tsx`
- Create: `app/join/[code]/JoinForm.tsx`
- Create: `app/api/guests/route.ts`

**Step 1** — Create `app/join/[code]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JoinForm from './JoinForm'

export default async function JoinPage({ params }: { params: { code: string } }) {
  const supabase = await createClient()
  const { data: party } = await supabase
    .from('parties')
    .select('id, name, host_name, event_dates, headcount, invite_code')
    .eq('invite_code', params.code)
    .single()

  if (!party) notFound()
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">You're invited</p>
      <h1 className="text-4xl font-bold tracking-tight mb-2">{party.name}</h1>
      <p className="text-zinc-400 text-sm mb-10">Hosted by {party.host_name} · {party.event_dates.join(', ')}</p>
      <JoinForm party={party} />
    </main>
  )
}
```

**Step 2** — Create `app/join/[code]/JoinForm.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinForm({ party }: { party: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const inputClass = "w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-3 text-sm focus:outline-none focus:border-white transition"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, party_id: party.id, invite_code: party.invite_code }),
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
```

**Step 3** — Create `app/api/guests/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('guests')
    .insert({
      party_id: body.party_id,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

**Step 4** — Test: open your invite link, fill out the join form, submit. Should redirect to `/vote/[CODE]?guest=[ID]` (404 is fine for now). Verify a new row in the `guests` table in Supabase.

**Step 5** — Commit:

```bash
git add .
git commit -m "feat: guest join flow"
```

---

---

## PART IV — THE VOTE

---

### Task 11: Load Venue Directory

**Step 1** — In the Supabase SQL Editor, run:

```sql
insert into venues (name, contact_email, capacity, min_spend, nights_available, neighborhood) values
('The Establishment', 'bookings@theestablishmentchs.com', 200, 2000, '{"Thursday","Friday","Saturday"}', 'Upper King'),
('Republic Garden & Lounge', 'vip@republicchs.com', 300, 3000, '{"Friday","Saturday"}', 'Upper King'),
('Trio Club', 'events@triochs.com', 150, 1500, '{"Thursday","Friday","Saturday"}', 'Upper King'),
('Mynt Ultralounge', 'reservations@myntchs.com', 250, 2500, '{"Friday","Saturday"}', 'Market Street'),
('Upstairs at Midtown', 'bookings@upstairsmidtown.com', 180, 1800, '{"Thursday","Friday","Saturday"}', 'Midtown'),
('Pantheon', 'vip@pantheoncharleston.com', 200, 2000, '{"Friday","Saturday"}', 'Upper King'),
('Rooftop at the Vendue', 'events@thevendue.com', 120, 1200, '{"Thursday","Friday","Saturday"}', 'French Quarter'),
('The Cocktail Club', 'reservations@thecocktailclub.com', 80, 800, '{"Thursday","Friday","Saturday"}', 'Upper King');
```

**Step 2** — Verify: 8 rows appear in the `venues` table.

---

### Task 12: Voting Page

**Files:**
- Create: `app/vote/[code]/page.tsx`
- Create: `app/vote/[code]/VoteForm.tsx`
- Create: `app/api/votes/route.ts`

**Step 1** — Create `app/vote/[code]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VoteForm from './VoteForm'

export default async function VotePage({
  params,
  searchParams,
}: {
  params: { code: string }
  searchParams: { guest?: string }
}) {
  const supabase = await createClient()

  const { data: party } = await supabase
    .from('parties')
    .select('id, name, event_dates')
    .eq('invite_code', params.code)
    .single()

  if (!party) notFound()

  const { data: venues } = await supabase.from('venues').select('*')

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16 max-w-xl mx-auto">
      <p className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Pick Your Spots</p>
      <h1 className="text-3xl font-bold tracking-tight mb-2">{party.name}</h1>
      <p className="text-zinc-400 text-sm mb-10">Rank your top 3 venues for {party.event_dates.join(', ')}</p>
      <VoteForm party={party} venues={venues ?? []} guestId={searchParams.guest ?? ''} />
    </main>
  )
}
```

**Step 2** — Create `app/vote/[code]/VoteForm.tsx`:

```typescript
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
    router.push(`/party/${party.invite_code}/confirmed`)
    setLoading(false)
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
```

**Step 3** — Create `app/api/votes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const votes = body.ranked.map((venue_id: string, index: number) => ({
    party_id: body.party_id,
    guest_id: body.guest_id,
    venue_id,
    rank: index + 1,
  }))

  const { error } = await supabase.from('votes').insert(votes)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

**Step 4** — Create `app/party/[code]/confirmed/page.tsx`:

```typescript
export default function ConfirmedPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">VOTES IN</h1>
      <p className="text-zinc-400 max-w-sm">Your picks are locked. We'll reach out to the top venues and confirm your night. Watch for a text.</p>
    </main>
  )
}
```

**Step 5** — Test the full guest flow end to end: join → vote → confirmation screen. Check the `votes` table in Supabase.

**Step 6** — Commit:

```bash
git add .
git commit -m "feat: guest voting flow"
```

---

---

## PART V — AUTOMATION

---

### Task 13: Venue Results API (for Make trigger)

**Files:**
- Create: `app/api/parties/[id]/close-voting/route.ts`

This API endpoint is what Make will call — or what the host presses manually — to close voting and see results.

**Step 1** — Create `app/api/parties/[id]/close-voting/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Tally votes: count how many times each venue was selected, weighted by rank
  const { data: votes } = await supabase
    .from('votes')
    .select('venue_id, rank, venues(name, contact_email)')
    .eq('party_id', params.id)

  if (!votes || votes.length === 0) {
    return NextResponse.json({ error: 'No votes yet' }, { status: 400 })
  }

  // Score: rank 1 = 3pts, rank 2 = 2pts, rank 3 = 1pt
  const scores: Record<string, { score: number; venue: any }> = {}
  for (const vote of votes) {
    const vid = vote.venue_id
    if (!scores[vid]) scores[vid] = { score: 0, venue: (vote as any).venues }
    scores[vid].score += (4 - vote.rank)
  }

  const top3 = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([venue_id, { venue }]) => ({ venue_id, venue }))

  // Insert venue_requests for top 3
  await supabase.from('venue_requests').insert(
    top3.map(({ venue_id }) => ({ party_id: params.id, venue_id, status: 'pending' }))
  )

  // Update party status
  await supabase.from('parties').update({ status: 'outreach_sent' }).eq('id', params.id)

  return NextResponse.json({ top3 })
}
```

**Step 2** — Add "Close Voting" button to host dashboard in `app/party/[code]/PartyDashboard.tsx`. Add this below the guests section:

```typescript
async function closeVoting() {
  await fetch(`/api/parties/${party.id}/close-voting`, { method: 'POST' })
  window.location.reload()
}

// In JSX, add this button if party.status === 'pending_votes':
{party.status === 'pending_votes' && (
  <button onClick={closeVoting}
    className="mt-8 w-full bg-white text-black py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-200 transition"
  >
    Close Voting + Send to Venues
  </button>
)}
```

---

### Task 14: Set Up Make Automations

No code. Visual setup in Make.

**Automation 1 — Venue Outreach Email**

1. Go to make.com → Create new scenario
2. Add trigger: **Webhooks → Custom Webhook** → copy the webhook URL
3. Add your webhook URL to Supabase as a Database Webhook on `venue_requests` INSERT
4. Add module: **Email (or Resend) → Send Email**
   - To: `{{venue.contact_email}}`
   - Subject: `VIP Table Request — [Party Name]`
   - Body: template with party details, headcount, dates, confirmation link
5. Save and activate

**Automation 2 — Booking Confirmed → Stripe Links to Guests**

1. Create new scenario
2. Trigger: **Webhooks → Custom Webhook**
3. Add to Supabase Database Webhook on `bookings` INSERT
4. Add module: **HTTP → Make a Request** to your Stripe API to create Payment Links per guest
5. Add module: **Twilio → Send SMS** with payment link to each guest phone
6. Save and activate

**Automation 3 — Day-of Reminders**

1. Create new scenario
2. Trigger: **Schedule → Every day at 10am**
3. Add module: **Supabase → Search Records** for bookings where `night_date = tomorrow`
4. Add module: **Twilio → Send SMS** to each guest with itinerary details
5. Save and activate

---

### Task 15: Stripe Payment API

**Files:**
- Create: `app/api/bookings/route.ts`
- Create: `app/api/stripe/webhook/route.ts`

**Step 1** — Create `app/api/bookings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const { party_id, venue_id, night_date, headcount, venue_min_spend } = body

  const gratuity = Math.round(venue_min_spend * 0.20)
  const service_fee = Math.round(venue_min_spend * 0.12)
  const total_cost = venue_min_spend + gratuity + service_fee
  const per_person_cost = Math.ceil(total_cost / headcount)

  // Create booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({ party_id, venue_id, night_date, headcount, total_cost, per_person_cost, gratuity })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get guests
  const { data: guests } = await supabase
    .from('guests')
    .select('id, name, phone, email')
    .eq('party_id', party_id)

  // Create Stripe Payment Links per guest
  for (const guest of guests ?? []) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Your share — ${night_date}` },
          unit_amount: per_person_cost * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/paid?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/party/${body.invite_code}`,
      metadata: { booking_id: booking.id, guest_id: guest.id },
    })

    await supabase.from('payments').insert({
      booking_id: booking.id,
      guest_id: guest.id,
      stripe_payment_id: session.id,
      amount: per_person_cost,
      status: 'pending',
    })
  }

  return NextResponse.json({ booking })
}
```

**Step 2** — Create `app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const supabase = await createClient()

    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('stripe_payment_id', session.id)

    await supabase
      .from('guests')
      .update({ paid: true })
      .eq('id', session.metadata?.guest_id)
  }

  return NextResponse.json({ received: true })
}
```

**Step 3** — In Stripe Dashboard: Developers → Webhooks → Add endpoint → your Vercel URL + `/api/stripe/webhook` → select `checkout.session.completed`

**Step 4** — Copy the webhook signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars.

**Step 5** — Commit:

```bash
git add .
git commit -m "feat: stripe payments and webhook"
```

---

---

## PART VI — POLISH + LAUNCH

---

### Task 16: Payment Success Page

**Files:**
- Create: `app/paid/page.tsx`

```typescript
export default function PaidPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-4">YOU'RE IN</h1>
      <p className="text-zinc-400 max-w-sm">Payment confirmed. Check your phone for your itinerary. See you this weekend.</p>
    </main>
  )
}
```

---

### Task 17: Mobile Polish

**Step 1** — On every page, verify these Tailwind classes are present:
- Containers use `max-w-xl mx-auto px-6`
- Buttons are `w-full` on mobile
- Text is legible: minimum `text-sm`

**Step 2** — Open Chrome DevTools → toggle device toolbar → test on iPhone 14 viewport (390px wide).

**Step 3** — Fix any overflow or cramped elements by adding `px-4` or adjusting `text-` sizes.

---

### Task 18: End-to-End Test

Run through the full flow manually before launch:

```
1. Go to /start → create a party
2. Copy invite link → open in incognito
3. Join as a guest → vote on 3 venues
4. Go back to party dashboard → close voting
5. Verify venue_requests created in Supabase
6. Verify Make automation fired (check Make run history)
7. Create a booking via API (use Postman or curl)
8. Verify Stripe checkout links created
9. Complete a test payment (use Stripe test card 4242 4242 4242 4242)
10. Verify payment status updates in Supabase
```

---

### Task 19: Deploy Final Version

**Step 1** — Push all changes to GitHub:

```bash
git add .
git commit -m "feat: complete tabbed mvp"
git push origin main
```

**Step 2** — Vercel auto-deploys on push. Watch the deployment in vercel.com dashboard.

**Step 3** — Update `NEXT_PUBLIC_BASE_URL` in Vercel if your domain has changed.

**Step 4** — Test the live URL end-to-end one more time.

**Step 5** — Share `/start` with your first Charleston group.

---

---

## LAUNCH CHECKLIST

```
Accounts created and API keys saved
Supabase schema live
Vercel deployment live
8 Charleston venues loaded
Make automations active
Stripe webhook configured
End-to-end test passed
First real tab started
```

---

*TABBED. Let's start a tab.*
