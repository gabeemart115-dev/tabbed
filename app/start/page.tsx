import StartForm from './StartForm'

export default function StartPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 md:px-12">
      <h2 className="text-3xl font-bold tracking-tight mb-2">START YOUR TAB</h2>
      <p className="text-zinc-500 mb-10 text-sm tracking-widest uppercase">Tell us about your night</p>
      <StartForm />
    </main>
  )
}