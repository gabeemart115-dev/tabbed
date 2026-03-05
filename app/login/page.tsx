import LoginForm from './LoginForm'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <h2 className="text-3xl font-bold tracking-tight mb-2">SIGN IN</h2>
      <p className="text-zinc-500 mb-10 text-sm tracking-widest uppercase">We'll send a link to your email</p>
      <LoginForm next={next} />
    </main>
  )
}
