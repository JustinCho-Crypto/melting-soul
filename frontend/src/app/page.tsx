import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-8 overflow-hidden p-8 text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute left-1/3 top-2/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 text-5xl backdrop-blur-sm">
          🔮
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
          melting soul
        </h1>

        <p className="max-w-lg text-lg leading-relaxed text-white/50">
          Trade AI Agent Souls as NFTs. Fork, evolve, and build on the shoulders of giants.
        </p>

        <Link
          href="/marketplace"
          className="rounded-full bg-white px-10 py-3.5 text-lg font-semibold text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          Enter App
        </Link>
      </div>

      <div className="relative mt-16 grid max-w-3xl grid-cols-3 gap-12 text-center">
        <div className="flex flex-col gap-3">
          <span className="text-3xl font-bold text-white">ERC-1155</span>
          <span className="text-sm text-white/40">Multi-copy Soul NFTs with provenance</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-3xl font-bold text-white">Fork</span>
          <span className="text-sm text-white/40">Evolve Souls into specialized versions</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-3xl font-bold text-white">Royalties</span>
          <span className="text-sm text-white/40">Origin & parent creators earn forever</span>
        </div>
      </div>
    </div>
  )
}
