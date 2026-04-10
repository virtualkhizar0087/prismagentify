const RETELL_BASE = 'https://api.retellai.com'
const RETELL_KEY = process.env.RETELL_API_KEY!

export const VOICES = [
  { id: 'sarah', name: 'Sarah', description: 'Friendly & warm', gender: 'female' },
  { id: 'james', name: 'James', description: 'Professional & clear', gender: 'male' },
  { id: 'aria', name: 'Aria', description: 'Energetic & helpful', gender: 'female' },
] as const

export type VoiceId = typeof VOICES[number]['id']

async function retellFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${RETELL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${RETELL_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Retell API error ${res.status}: ${text}`)
  }
  return res.json()
}

export async function createRetellAgent({
  agentName,
  voiceId,
  systemPrompt,
}: {
  agentName: string
  voiceId: string
  systemPrompt: string
}): Promise<{ agent_id: string }> {
  return retellFetch('/create-agent', {
    method: 'POST',
    body: JSON.stringify({
      agent_name: agentName,
      voice_id: voiceId,
      response_engine: {
        type: 'retell-llm',
        llm_id: await getOrCreateLLM(systemPrompt),
      },
    }),
  })
}

async function getOrCreateLLM(systemPrompt: string): Promise<string> {
  const llm = await retellFetch('/create-retell-llm', {
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4o',
      general_prompt: systemPrompt,
    }),
  })
  return llm.llm_id
}

export async function createRetellPhoneNumber(agentId: string): Promise<{ phone_number: string }> {
  return retellFetch('/create-phone-number', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId, area_code: '415' }),
  })
}

export async function deleteRetellAgent(agentId: string): Promise<void> {
  await retellFetch(`/delete-agent/${agentId}`, { method: 'DELETE' })
}

export async function deleteRetellPhoneNumber(phoneNumber: string): Promise<void> {
  const encoded = encodeURIComponent(phoneNumber)
  await retellFetch(`/delete-phone-number/${encoded}`, { method: 'DELETE' })
}

export async function updateRetellAgent(agentId: string, systemPrompt: string): Promise<void> {
  await retellFetch(`/update-agent/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ general_prompt: systemPrompt }),
  })
}

export function buildSystemPrompt({
  businessName,
  vertical,
  hours,
  address,
  customInstructions,
  basePrompt,
  language = 'en',
  escalationPhone,
  opentableId,
  mindbodySiteId,
  posType,
  smsFollowup = false,
  menuItems,
}: {
  businessName: string
  vertical: string
  hours: string
  address: string
  customInstructions: string
  basePrompt: string
  language?: 'en' | 'es' | 'bilingual'
  escalationPhone?: string | null
  opentableId?: string | null
  mindbodySiteId?: string | null
  posType?: string | null
  smsFollowup?: boolean
  menuItems?: string | null
}): string {
  let prompt = basePrompt
    .replace(/\{\{business_name\}\}/g, businessName)
    .replace(/\{\{hours\}\}/g, hours)
    .replace(/\{\{address\}\}/g, address || 'not provided')
    .replace(/\{\{custom_instructions\}\}/g, customInstructions || 'None')
    .replace(/\{\{menu\}\}/g, menuItems || 'not provided')

  // Menu knowledge — injected directly so AI can answer any menu question
  if (menuItems && menuItems.trim().length > 0) {
    prompt += `\n\nMENU KNOWLEDGE:\nYou have full knowledge of our menu. Use this to answer any food, drink, dietary, allergen, or pricing questions:\n\n${menuItems}\n\nWhen asked about specific dishes, prices, or dietary options, answer confidently using the menu above. If a specific item is not on the menu, say so politely. Never make up dishes or prices that are not listed.`
  } else {
    prompt += `\n\nMENU KNOWLEDGE:\nNo menu has been provided yet. If callers ask about specific menu items or prices, politely say: "For detailed menu information, I'd recommend checking our website or I can take your number and have someone call you back."`
  }

  // Human escalation
  const escalation = escalationPhone
    ? `If the caller asks to speak with a human, the owner, or a manager — or if they are angry or upset — say: "Let me connect you with our team right away." Then transfer the call to ${escalationPhone}. You can also transfer if the caller says "transfer", "agent", "human", or presses 0.`
    : `If the caller asks to speak with a human or manager, apologize and say you will pass on their message urgently. Always collect their name and callback number before ending.`
  prompt += `\n\nHUMAN ESCALATION POLICY:\n${escalation}`

  // Language
  if (language === 'es') {
    prompt += `\n\nLANGUAGE: Respond ONLY in Spanish. All responses must be in Spanish.`
  } else if (language === 'bilingual') {
    prompt += `\n\nLANGUAGE: Detect the caller's language from their first sentence. If they speak Spanish, respond in Spanish for the entire call. If they speak English, respond in English. Never mix languages mid-sentence.`
  }

  // SMS follow-up
  if (smsFollowup) {
    prompt += `\n\nSMS CONFIRMATION: At the end of every call where you have taken a booking, reservation, or captured a lead — always inform the caller: "I'll send you a text confirmation shortly." This builds trust and reduces no-shows.`
  }

  // Integration hints
  if (opentableId) {
    prompt += `\n\nRESERVATION SYSTEM: This restaurant uses OpenTable. When confirming a reservation, let the caller know they will also receive an OpenTable confirmation email/SMS if they are in the system.`
  }
  if (mindbodySiteId) {
    prompt += `\n\nBOOKING SYSTEM: This gym uses Mindbody for class and appointment booking. When someone books a trial or class, inform them they will receive a Mindbody confirmation with details.`
  }
  if (posType && posType !== 'none') {
    const posName = posType === 'toast' ? 'Toast' : posType === 'square' ? 'Square' : 'Clover'
    prompt += `\n\nPOS SYSTEM: Orders are processed through ${posName}. When taking a phone order, collect all items, sizes, and any modifications clearly so the order can be entered accurately.`
  }

  return prompt
}
