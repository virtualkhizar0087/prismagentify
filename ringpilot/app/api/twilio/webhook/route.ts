import { NextResponse } from 'next/server'

// Twilio sends events when calls come in — Retell handles routing via their integration
// This endpoint is a pass-through for Twilio status callbacks
export async function POST(request: Request) {
  const formData = await request.formData()
  const callStatus = formData.get('CallStatus')
  const from = formData.get('From')
  const to = formData.get('To')

  console.log(`Twilio callback: ${callStatus} | From: ${from} → To: ${to}`)

  // Twilio expects a TwiML response for voice calls
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
