'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const NAV_ITEMS = [
  { href: '/marketplace', label: 'Collection' },
  { href: '/my-souls', label: 'My Souls' },
  { href: '/create', label: 'Create' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <Link href="/" className="text-xl font-bold text-white">
        Melting Soul
      </Link>

      <nav className="flex items-center gap-6">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              pathname === href
                ? 'text-white font-medium'
                : 'text-white/50 hover:text-white transition-colors'
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      <ConnectButton />
    </header>
  )
}
