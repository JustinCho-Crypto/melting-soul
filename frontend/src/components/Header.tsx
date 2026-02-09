'use client'

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <Link href="/" className="text-xl font-bold text-white">
        Melting Soul
      </Link>

      <nav className="flex items-center gap-6">
        <Link href="/marketplace" className="text-white/70 hover:text-white transition-colors">
          Collection
        </Link>
        <Link href="/my-souls" className="text-white/70 hover:text-white transition-colors">
          My Souls
        </Link>
        <Link href="/create" className="text-white/70 hover:text-white transition-colors">
          Create
        </Link>
      </nav>

      <ConnectButton />
    </header>
  )
}
