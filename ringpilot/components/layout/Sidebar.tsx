'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Phone, LayoutDashboard, PhoneCall, Bot, CreditCard, Settings, LogOut, ChevronRight, BarChart2, PhoneOutgoing, Inbox, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/layout/NotificationBell'
import type { User } from '@/types/database'

const NAV = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/calls',         label: 'Call Log',       icon: PhoneCall },
  { href: '/inbox',         label: 'Inbox',          icon: Inbox },
  { href: '/agents',        label: 'My Agents',      icon: Bot },
  { href: '/analytics',     label: 'Analytics',      icon: BarChart2 },
  { href: '/campaigns',     label: 'Campaigns',      icon: PhoneOutgoing },
  { href: '/notifications', label: 'Notifications',  icon: Bell },
  { href: '/billing',       label: 'Billing',         icon: CreditCard },
  { href: '/settings',      label: 'Settings',       icon: Settings },
]

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  agency: 'bg-amber-100 text-amber-700',
}

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Phone className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">RingPilot</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          )
        })}

        {/* Quick create agent */}
        <div className="pt-3 mt-3 border-t border-gray-800">
          <Link
            href="/agents/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors"
          >
            <Bot className="h-4 w-4 shrink-0" />
            + New AI Agent
          </Link>
        </div>
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.business_name || user?.full_name || 'My Business'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', PLAN_COLORS[user?.plan || 'free'])}>
            {user?.plan || 'free'} plan
          </span>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button
              onClick={handleSignout}
              className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-gray-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
