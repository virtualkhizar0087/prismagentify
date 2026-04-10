/**
 * POST /api/deadlines/remind
 *
 * Scans all deadlines and sends reminder emails for those due in 30, 7, or 1 day.
 * Call this from a cron job (e.g. Vercel Cron, GitHub Actions, or any scheduler).
 *
 * Secure with CRON_SECRET header:
 *   Authorization: Bearer <CRON_SECRET env var>
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDeadlineReminderEmail } from '@/lib/resend'

type DeadlineWithEmail = {
  id: string
  contract_name: string
  deadline_type: string
  description: string
  deadline_date: string
  notice_period_days: number | null
  reminder_30_sent: boolean
  reminder_7_sent: boolean
  reminder_1_sent: boolean
  users: { email: string } | null
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all upcoming deadlines joined with user email
  const { data: deadlines, error } = await supabase
    .from('deadlines')
    .select('*, users(email)')
    .gte('deadline_date', new Date().toISOString().split('T')[0])
    .order('deadline_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (deadlines ?? []) as DeadlineWithEmail[]
  let sent = 0

  for (const d of rows) {
    const days = daysUntil(d.deadline_date)
    const email = d.users?.email
    if (!email) continue

    const shouldSend30 = days <= 30 && !d.reminder_30_sent
    const shouldSend7 = days <= 7 && !d.reminder_7_sent
    const shouldSend1 = days <= 1 && !d.reminder_1_sent

    if (!shouldSend30 && !shouldSend7 && !shouldSend1) continue

    try {
      await sendDeadlineReminderEmail(email, {
        contractName: d.contract_name,
        description: d.description,
        deadlineDate: d.deadline_date,
        daysUntil: days,
        deadlineType: d.deadline_type,
      })

      // Mark which reminders were sent
      const updates: Record<string, boolean> = {}
      if (shouldSend30) updates.reminder_30_sent = true
      if (shouldSend7) updates.reminder_7_sent = true
      if (shouldSend1) updates.reminder_1_sent = true

      await supabase.from('deadlines').update(updates).eq('id', d.id)
      sent++
    } catch (e) {
      console.error(`Failed to send reminder for deadline ${d.id}:`, e)
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent })
}
