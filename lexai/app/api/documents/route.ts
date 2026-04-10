import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLegalDocument } from '@/lib/claude'
import type { DocumentType } from '@/types/database'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check plan: free users cannot generate documents
  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'free') {
    return NextResponse.json(
      { error: 'Document generation requires a paid plan. Please upgrade.' },
      { status: 403 }
    )
  }

  const { type, title, details } = await request.json() as {
    type: DocumentType
    title: string
    details: Record<string, string>
  }

  if (!type || !details) {
    return NextResponse.json(
      { error: 'Document type and details are required' },
      { status: 400 }
    )
  }

  const content = await generateLegalDocument({ type, details })

  const { data: doc, error: dbError } = await supabase
    .from('documents_generated')
    .insert({
      user_id: user.id,
      type,
      title: title || `${type.replace(/_/g, ' ')} - ${new Date().toLocaleDateString()}`,
      content,
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB error saving document:', dbError)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }

  return NextResponse.json({ document: doc })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: documents, error } = await supabase
    .from('documents_generated')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents })
}
