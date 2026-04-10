import { createClient } from '@/lib/supabase/server'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(20)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Legal AI Chat</h1>
        <p className="mt-1 text-gray-500">
          Ask any business legal question. Your AI co-pilot will provide clear, actionable guidance.
        </p>
      </div>

      <ChatInterface
        userId={user!.id}
        initialConversations={conversations ?? []}
      />
    </div>
  )
}
