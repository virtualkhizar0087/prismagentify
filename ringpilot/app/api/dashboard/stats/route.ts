import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    { count: callsToday },
    { count: callsThisWeek },
    { count: callsThisMonth },
    { data: agents },
  ] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString()),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', weekAgo.toISOString()),
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
    supabase.from('agents').select('calls_this_month, status').eq('user_id', user.id),
  ])

  const activeAgents = agents?.filter(a => a.status === 'active').length ?? 0
  // Savings estimate: avg receptionist costs $18/hr × 8hrs/day
  const savingsEstimate = Math.round((callsThisMonth ?? 0) * 2.5)

  return NextResponse.json({
    callsToday: callsToday ?? 0,
    callsThisWeek: callsThisWeek ?? 0,
    callsThisMonth: callsThisMonth ?? 0,
    activeAgents,
    savingsEstimate,
  })
}
