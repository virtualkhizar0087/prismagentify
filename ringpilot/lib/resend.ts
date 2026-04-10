import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@ringpilot.com'

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to RingPilot — your AI receptionist is ready',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Welcome to RingPilot</h1>
          <p style="color:#bfdbfe;margin:8px 0 0">Your AI receptionist. Never misses a call.</p>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 8px 8px">
          <p style="color:#1e293b;font-size:16px">Hi ${name || 'there'},</p>
          <p style="color:#475569">Your 14-day free trial has started. Set up your AI agent in under 10 minutes and never miss a customer call again.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/agents/new" style="background:#2563eb;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
              Set Up My AI Agent →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:14px">Need help? Reply to this email anytime.</p>
        </div>
      </div>
    `,
  })
}

export async function sendUpgradeEmail(email: string, name: string, plan: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're on the ${plan} plan — RingPilot`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <div style="background:#2563eb;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">You upgraded to ${plan}!</h1>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 8px 8px">
          <p style="color:#1e293b;font-size:16px">Hi ${name || 'there'},</p>
          <p style="color:#475569">Your RingPilot account is now on the <strong>${plan}</strong> plan. Your new limits are active immediately.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#2563eb;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">
              Go to Dashboard →
            </a>
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendCallSummaryEmail(email: string, summary: string, agentName: string, from: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `New call on ${agentName} — RingPilot`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <div style="background:#1e40af;padding:20px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:18px">📞 New call handled by ${agentName}</h2>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p style="color:#64748b;font-size:14px;margin:0 0 8px">From: ${from}</p>
          <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px;border-radius:4px">
            <p style="color:#1e293b;margin:0;font-size:15px">${summary}</p>
          </div>
          <div style="text-align:center;margin:24px 0 0">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/calls" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              View Full Transcript
            </a>
          </div>
        </div>
      </div>
    `,
  })
}
