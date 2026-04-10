'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileSearch,
  MessageSquare,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Scale,
  Bell,
  GitCompare,
  Gift,
  BookOpen,
  BookMarked,
  CalendarDays,
  LayoutTemplate,
  BarChart2,
  Library,
  Lightbulb,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials } from '@/lib/utils'
import type { User } from '@/types/database'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/advisor', label: 'Legal Advisor', icon: Lightbulb, badge: 'NEW' },
  { href: '/precedents', label: 'Case Law', icon: BookOpen },
  { href: '/statutes', label: 'Statutes', icon: BookMarked },
  { href: '/contracts', label: 'Contracts', icon: FileSearch },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/clauses', label: 'Clause Library', icon: Library },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/deadlines', label: 'Deadlines', icon: Bell },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/referral', label: 'Refer & Earn', icon: Gift },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const planBadgeColors = {
  free: 'bg-gray-100 text-gray-600',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-lexai-100 text-lexai-700',
  team: 'bg-purple-100 text-purple-700',
}

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4">
        <Scale className="h-6 w-6 text-lexai-600" />
        <span className="text-lg font-bold text-lexai-700">Court of AI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {(navItems as { href: string; label: string; icon: React.ElementType; badge?: string }[]).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-lexai-50 text-lexai-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      isActive ? 'text-lexai-600' : 'text-gray-400'
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-lexai-100 px-1.5 py-0.5 text-[9px] font-bold text-lexai-700 uppercase tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lexai-100 text-xs font-semibold text-lexai-700">
            {user?.full_name ? getInitials(user.full_name) : user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-900">
              {user?.full_name ?? user?.email}
            </p>
            <span
              className={cn(
                'inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                planBadgeColors[user?.plan ?? 'free']
              )}
            >
              {user?.plan ?? 'free'}
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
