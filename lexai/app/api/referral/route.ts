import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — fetch current user's referral code + stats
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('referral_code, referral_count')
    .eq('id', user.id)
    .single()

  // Generate a referral code if they don't have one
  if (!profile?.referral_code) {
    const code = generateCode(user.id)
    await supabase.from('users').update({ referral_code: code }).eq('id', user.id)
    return NextResponse.json({ referralCode: code, referralCount: 0 })
  }

  return NextResponse.json({
    referralCode: profile.referral_code,
    referralCount: profile.referral_count ?? 0,
  })
}

function generateCode(userId: string): string {
  // Short 8-char alphanumeric code derived from user ID
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  let code = ''
  let h = Math.abs(hash)
  for (let i = 0; i < 8; i++) {
    code += chars[h % chars.length]
    h = Math.floor(h / chars.length) + (i * 7919)
  }
  return code
}
