'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const NAV_ITEMS = [
  { href: '/marketplace', label: 'Collection' },
  { href: '/lineage', label: 'Lineage' },
  { href: '/my-souls', label: 'My Souls' },
  { href: '/create', label: 'Create' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-astral-border bg-void-black/80 px-6 py-3 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold text-ghost-white">
        <span className="text-xl">🔮</span>
        Soul Marketplace
      </Link>

      <nav className="flex items-center gap-6">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              pathname === href || pathname.startsWith(href + '/')
                ? 'text-soul-purple font-medium'
                : 'text-astral-gray transition-colors hover:text-ghost-white'
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
