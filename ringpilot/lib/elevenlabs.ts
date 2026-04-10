const EL_BASE = 'https://api.elevenlabs.io/v1'
const EL_KEY = process.env.ELEVENLABS_API_KEY!

// ── ElevenLabs Conversational AI voices ──────────────────────────────────────
export const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',   description: 'Friendly & warm',        gender: 'female' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',   description: 'Professional & clear',    gender: 'female' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria',     description: 'Energetic & helpful',     gender: 'female' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie',  description: 'Natural & conversational', gender: 'male'  },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',   description: 'Calm & authoritative',    gender: 'male'  },
] as const

export type VoiceId = typeof VOICES[number]['id']

// ── Internal fetch helper ─────────────────────────────────────────────────────
async function elFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${EL_BASE}${path}`, {
    ...options,
    headers: {
      'xi-api-key': EL_KEY,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ElevenLabs API error ${res.status}: ${text}`)
  }
  // DELETE returns 204 no content
  if (res.status === 204) return {}
  return res.json()
}

// ── Create a Conversational AI agent ─────────────────────────────────────────
export async function createElevenLabsAgent({
  agentName,
  voiceId,
  systemPrompt,
  language = 'en',
  firstMessage,
}: {
  agentName: string
  voiceId: string
  systemPrompt: string
  language?: string
  firstMessage?: string | null
}): Promise<{ agent_id: string }> {
  // English agents → eleven_turbo_v2 (English only)
  // Spanish / Bilingual agents → eleven_turbo_v2_5 (multilingual)
  const lang = language === 'bilingual' ? 'en' : language
  const modelId = language === 'en' ? 'eleven_turbo_v2' : 'eleven_turbo_v2_5'

  const data = await elFetch('/convai/agents/create', {
    method: 'POST',
    body: JSON.stringify({
      name: agentName,
      conversation_config: {
        agent: {
          prompt: {
            prompt: systemPrompt,
            llm: 'gpt-4o-mini',
            temperature: 0.5,
            max_tokens: 300,
          },
          first_message: firstMessage?.trim() || `Thank you for calling ${agentName}. How can I help you today?`,
          language: lang,
        },
        tts: {
          voice_id: voiceId,
          model_id: modelId,
          optimize_streaming_latency: 3,
        },
        turn: {
          mode: 'auto',         // server-side VAD — detects when user stops talking
          turn_timeout: 7,
        },
        conversation: {
          max_duration_seconds: 1800,
        },
      },
      platform_settings: {
        widget: {
          shareable: true,
        },
      },
    }),
  })

  return { agent_id: data.agent_id }
}

// ── Update agent system prompt ────────────────────────────────────────────────
export async function updateElevenLabsAgent(
  agentId: string,
  systemPrompt: string,
  language = 'en'
): Promise<void> {
  const lang = language === 'bilingual' ? 'en' : language
  const modelId = language === 'en' ? 'eleven_turbo_v2' : 'eleven_turbo_v2_5'
  await elFetch(`/convai/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: { prompt: systemPrompt },
          language: lang,
        },
        tts: {
          model_id: modelId,
        },
      },
    }),
  })
}

// ── Make an existing agent shareable + fix turn mode so widget VAD works ──────
export async function makeElevenLabsAgentShareable(agentId: string): Promise<void> {
  await elFetch(`/convai/agents/${agentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      conversation_config: {
        turn: {
          mode: 'auto',       // server-side VAD — without this agent never replies after user speaks
          turn_timeout: 7,
        },
      },
      platform_settings: {
        widget: {
          shareable: true,
        },
      },
    }),
  })
}

// ── Delete agent ──────────────────────────────────────────────────────────────
export async function deleteElevenLabsAgent(agentId: string): Promise<void> {
  await elFetch(`/convai/agents/${agentId}`, { method: 'DELETE' })
}

// ── Register a Twilio phone number with an agent ──────────────────────────────
export async function createElevenLabsPhoneNumber(
  agentId: string,
  twilioNumber: string,
  label: string
): Promise<{ phone_number_id: string; phone_number: string }> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN

  if (!sid || !token || sid === 'ACplaceholder') {
    // Dev fallback — return a mock number so DB still gets a value
    console.warn('Twilio credentials not set — skipping phone number registration')
    return { phone_number_id: 'mock', phone_number: twilioNumber || '+10000000000' }
  }

  const data = await elFetch('/convai/phone-numbers/create', {
    method: 'POST',
    body: JSON.stringify({
      phone_number:          twilioNumber,
      phone_number_provider: 'twilio',
      label,
      agent_id:              agentId,
      twilio_account_sid:    sid,
      twilio_auth_token:     token,
    }),
  })

  return {
    phone_number_id: data.phone_number_id,
    phone_number:    data.phone_number,
  }
}

// ── Delete / unlink a phone number ────────────────────────────────────────────
export async function deleteElevenLabsPhoneNumber(phoneNumberId: string): Promise<void> {
  if (!phoneNumberId || phoneNumberId === 'mock') return
  await elFetch(`/convai/phone-numbers/${phoneNumberId}`, { method: 'DELETE' })
}

// ── Build the system prompt (same as before, works with ElevenLabs) ───────────
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
  faqs,
  afterHoursMessage,
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
  faqs?: { question: string; answer: string }[]
  afterHoursMessage?: string | null
}): string {
  let prompt = basePrompt
    .replace(/\{\{business_name\}\}/g, businessName)
    .replace(/\{\{hours\}\}/g, hours)
    .replace(/\{\{address\}\}/g, address || 'not provided')
    .replace(/\{\{custom_instructions\}\}/g, customInstructions || 'None')
    .replace(/\{\{menu\}\}/g, menuItems || 'not provided')

  // Menu knowledge
  if (menuItems && menuItems.trim().length > 0) {
    prompt += `\n\nMENU KNOWLEDGE:\nYou have full knowledge of the menu. Use this to answer any food, drink, dietary, allergen, or pricing questions:\n\n${menuItems}\n\nAnswer menu questions confidently. If a specific item is not listed, say so politely. Never make up dishes or prices.`
  } else {
    prompt += `\n\nMENU KNOWLEDGE:\nNo menu has been provided. If callers ask about specific items or prices, say: "For detailed menu information, please check our website or I can take your number and have someone call you back."`
  }

  // Human escalation
  const escalation = escalationPhone
    ? `If the caller asks to speak with a human, the owner, or a manager — or if they are angry or upset — say: "Let me connect you with our team right away." Then transfer the call to ${escalationPhone}. Also transfer if the caller says "transfer", "agent", "human", or presses 0.`
    : `If the caller asks to speak with a human or manager, apologize and say you will pass on their message urgently. Always collect their name and callback number before ending.`
  prompt += `\n\nHUMAN ESCALATION POLICY:\n${escalation}`

  // Language
  if (language === 'es') {
    prompt += `\n\nLANGUAGE: Respond ONLY in Spanish. All responses must be in Spanish.`
  } else if (language === 'bilingual') {
    prompt += `\n\nLANGUAGE: Detect the caller's language from their first sentence. Respond in Spanish if they speak Spanish, English if they speak English. Never mix languages mid-sentence.`
  }

  // SMS follow-up
  if (smsFollowup) {
    prompt += `\n\nSMS CONFIRMATION: At the end of every call where you have taken a booking or captured a lead — always tell the caller: "I'll send you a text confirmation shortly."`
  }

  // Integrations
  if (opentableId) {
    prompt += `\n\nRESERVATION SYSTEM: This restaurant uses OpenTable. When confirming a reservation, let the caller know they will also receive an OpenTable confirmation.`
  }
  if (mindbodySiteId) {
    prompt += `\n\nBOOKING SYSTEM: This gym uses Mindbody. When someone books a trial or class, inform them they will receive a Mindbody confirmation.`
  }
  if (posType && posType !== 'none') {
    const posName = posType === 'toast' ? 'Toast' : posType === 'square' ? 'Square' : 'Clover'
    prompt += `\n\nPOS SYSTEM: Orders are processed through ${posName}. Collect all items, sizes, and modifications clearly.`
  }

  // FAQ knowledge base
  if (faqs && faqs.length > 0) {
    const faqText = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
    prompt += `\n\nFREQUENTLY ASKED QUESTIONS:\nUse these exact answers when callers ask these questions:\n\n${faqText}\n\nAlways use these answers verbatim — do not improvise on these points.`
  }

  // After-hours
  if (afterHoursMessage && afterHoursMessage.trim().length > 0) {
    prompt += `\n\nAFTER-HOURS HANDLING:\nIf a caller contacts you outside of business hours (${hours}), say the following: "${afterHoursMessage.trim()}" — then offer to take their name and callback number.`
  }

  return prompt
}
