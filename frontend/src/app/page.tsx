import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="text-6xl">🔮</div>

      <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
        melting soul
      </h1>

      <p className="max-w-md text-lg text-white/50">
        Trade AI Agent Souls as NFTs. Fork, evolve, and build on the shoulders of giants.
      </p>

      <Link
        href="/marketplace"
        className="rounded-full bg-white px-8 py-3 font-semibold text-black transition-opacity hover:opacity-90"
      >
        Enter App
      </Link>

      <div className="mt-12 grid max-w-2xl grid-cols-3 gap-8 text-center">
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-white">ERC-1155</span>
          <span className="text-sm text-white/40">Multi-copy Soul NFTs</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-white">Fork</span>
          <span className="text-sm text-white/40">Evolve & specialize</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-2xl font-bold text-white">Royalties</span>
          <span className="text-sm text-white/40">Creators earn forever</span>
        </div>
      </div>
    </div>
  )
}
