import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import type { PlanKey } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  let plan: PlanKey
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    plan = formData.get('plan') as PlanKey
  } else {
    const body = await request.json()
    plan = body.plan as PlanKey
  }

  if (!plan || !['starter', 'pro', 'agency'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
  const session = await createCheckoutSession({
    userId: user.id,
    userEmail: user.email!,
    plan,
    successUrl: `${origin}/billing?success=true`,
    cancelUrl: `${origin}/billing?canceled=true`,
  })

  return NextResponse.redirect(session.url!, { status: 303 })
}
