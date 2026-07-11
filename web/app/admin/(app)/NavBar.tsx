'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/channels', label: 'Channels' },
  { href: '/admin/jobs', label: 'Jobs' }
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="admin-nav">
      <span className="admin-nav-title">EPG Admin</span>
      <div className="admin-nav-links">
        {LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(pathname, link.href) ? 'admin-nav-link active' : 'admin-nav-link'}
          >
            {link.label}
          </Link>
        ))}
        <form method="POST" action="/api/admin/auth/logout" className="admin-nav-logout-form">
          <button type="submit" className="admin-nav-logout">
            Log out
          </button>
        </form>
      </div>
    </nav>
  )
}
