import Link from 'next/link'

const FOOTER_LINKS = {
  Product: [
    { label: 'Collection', href: '/marketplace' },
    { label: 'Create (Fork)', href: '/create' },
    { label: 'My Souls', href: '/my-souls' },
    { label: 'Swap $SOUL', href: '#' },
  ],
  Resources: [
    { label: 'Docs', href: '#' },
    { label: 'MoltBot Guide', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
  Community: [
    { label: 'Twitter', href: '#' },
    { label: 'Discord', href: '#' },
    { label: 'Telegram', href: '#' },
  ],
  Legal: [
    { label: 'Terms', href: '#' },
    { label: 'Privacy', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-astral-border bg-dark-nebula">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-ghost-white">Soul Marketplace</span>
            <p className="mt-2 text-sm text-nebula-gray">
              Marketplace for AI Personalities
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-astral-gray">{category}</span>
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-nebula-gray transition-colors hover:text-soul-purple"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-astral-border pt-6 text-center text-sm text-nebula-gray">
          &copy; 2026 Soul Marketplace &middot; Built for Agent Hackathon
        </div>
      </div>
    </footer>
  )
}
