import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect('/login')

  const { data: profile } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single()
  if (!profile?.stripe_customer_id) return NextResponse.redirect('/billing')

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!
  const session = await createPortalSession({
    stripeCustomerId: profile.stripe_customer_id,
    returnUrl: `${origin}/billing`,
  })

  return NextResponse.redirect(session.url, { status: 303 })
}
