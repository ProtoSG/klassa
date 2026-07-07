'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Estadísticas', href: '#estadisticas' },
  { label: 'Características', href: '#caracteristicas' },
  { label: 'Precios', href: '#precios' },
  { label: 'Demo', href: '#demo' },
]

export default function LandingNav() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeMenu = () => {
    setClosing(true)
  }

  const toggleMenu = () => {
    if (open) closeMenu()
    else setOpen(true)
  }

  // Unmount panel after collapse animation ends
  const onPanelAnimEnd = () => {
    if (closing) {
      setClosing(false)
      setOpen(false)
    }
  }

  return (
    <header className="fixed top-5 left-5 right-5 z-50">
      <div className="bg-ink rounded-xl px-2 py-1.5 max-w-7xl mx-auto flex items-center gap-1">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-2 mr-2 shrink-0">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-ink font-semibold text-sm">K</span>
          </div>
          <span className="text-white font-medium text-sm hidden sm:block">Klassa</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex-1 md:flex-none" />

        {/* CTA */}
        <Link
          href="/auth/login"
          className="hidden sm:inline-flex items-center gap-1.5 bg-white border border-trim text-ink text-sm font-medium px-4 py-2 rounded-lg hover:scale-105 transition-transform duration-300 shrink-0"
        >
          Iniciar sesión
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={toggleMenu}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Menú"
        >
          {open && !closing ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu — container transform from hamburger */}
      {open && (
        <div
          onAnimationEnd={onPanelAnimEnd}
          className={`md:hidden mt-2 bg-ink rounded-xl px-3 py-3 max-w-7xl mx-auto flex flex-col gap-1 shadow-hover ${
            closing ? 'animate-menu-close' : 'animate-menu-open'
          }`}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={closeMenu}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="border-t border-white/10 mt-1 pt-2">
            <Link
              href="/auth/login"
              className="flex items-center justify-center bg-white text-ink text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent/80 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
