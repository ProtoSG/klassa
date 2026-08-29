'use client'

import { Sparkles } from 'lucide-react'
import { useSession } from '@/shared/store/session'
import { useSidebar } from '@/shared/store/sidebar'
import { useAssistantChat } from '@/shared/store/assistant'
import TenantUserMenu from './TenantUserMenu'

export default function TenantHeader() {
  const { subdomain } = useSession()
  const collapsed = useSidebar((s) => s.collapsed)
  const toggleAssistant = useAssistantChat((s) => s.toggle)

  return (
    <header
      className={`hidden md:block fixed top-5 right-5 z-50 transition-[left] duration-200 ${
        collapsed ? 'left-24' : 'left-52'
      }`}
    >
      <div className="bg-ink rounded-xl px-2 py-1.5 max-w-7xl mx-auto flex items-center justify-between gap-1">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-ink font-semibold text-sm">K</span>
          </div>
          {subdomain && (
            <span className="text-xs text-white/50 font-mono">{subdomain}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAssistant}
            aria-label="Abrir asistente"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
          >
            <Sparkles size={16} />
          </button>
          <TenantUserMenu />
        </div>
      </div>
    </header>
  )
}
