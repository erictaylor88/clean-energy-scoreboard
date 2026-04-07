'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/#rankings', label: 'Rankings' },
  { href: '/states', label: 'States' },
  { href: '/#trends', label: 'Trends' },
  { href: '/race', label: 'Race' },
  { href: '/compare', label: 'Compare' },
  { href: '/share', label: 'Share' },
  { href: '/embed', label: 'Embed' },
  { href: '/about', label: 'About' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // Hide header entirely on embed routes
  if (pathname.startsWith('/embed/score') || pathname.startsWith('/embed/leaderboard') || pathname.startsWith('/embed/country/')) {
    return null
  }

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-[rgba(8,15,12,0.8)] backdrop-blur-[12px]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
          className="font-display font-bold text-text-primary text-sm tracking-tight hover:text-accent-green transition-colors duration-150"
        >
          Clean Energy Scoreboard
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-body text-text-secondary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-text-primary transition-colors duration-150 ${
                pathname === link.href ? 'text-text-primary' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Hamburger button (mobile) */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 -mr-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-[2px] bg-text-primary transition-all duration-200 ${
              menuOpen ? 'translate-y-[3px] rotate-45' : ''
            }`}
          />
          <span
            className={`block w-5 h-[2px] bg-text-primary mt-[4px] transition-all duration-200 ${
              menuOpen ? '-translate-y-[3px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-12 z-40 bg-[rgba(8,15,12,0.85)] backdrop-blur-xl"
          onClick={() => setMenuOpen(false)}
        >
          <nav
            className="flex flex-col px-6 pt-8 gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 text-lg font-body font-medium transition-colors duration-150 border-b border-border-subtle ${
                  pathname === link.href
                    ? 'text-accent-green'
                    : 'text-text-primary hover:text-accent-green'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
