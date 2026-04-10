import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@lexai.app'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ============================================================
// EMAIL TEMPLATES
// ============================================================

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Court of AI — Your AI Legal Co-Pilot',
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">⚖️ Court of AI</h1>
    <p style="color: #6b7280; margin-top: 4px;">Your AI Legal Co-Pilot</p>
  </div>

  <h2 style="font-size: 22px;">Welcome, ${name || 'there'}!</h2>

  <p>You're now set up with Court of AI — the AI-powered legal assistant built for small businesses like yours.</p>

  <p><strong>Here's what you can do right away:</strong></p>
  <ul>
    <li>📄 <strong>Analyze contracts</strong> — upload any contract and get a risk score, red flags, and plain-English summary</li>
    <li>💬 <strong>Ask legal questions</strong> — chat with your AI co-pilot about any business legal topic</li>
    <li>📝 <strong>Generate documents</strong> — create NDAs, service agreements, and more in minutes</li>
  </ul>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${APP_URL}/dashboard"
       style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Go to Dashboard →
    </a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    Remember: Court of AI is an AI assistant, not a licensed attorney. For complex legal matters, always consult a qualified lawyer.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Court of AI · <a href="${APP_URL}/settings" style="color: #9ca3af;">Unsubscribe</a>
  </p>
</body>
</html>`,
  })
}

export async function sendUpgradeConfirmationEmail(
  to: string,
  name: string,
  plan: string
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're now on Court of AI ${plan} — welcome to the next level`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">⚖️ Court of AI</h1>
  </div>

  <h2>You're now on the <span style="color: #4f46e5;">${plan}</span> plan!</h2>

  <p>Hi ${name || 'there'}, your upgrade is confirmed and active immediately.</p>

  <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; font-weight: 600;">Your ${plan} plan includes:</p>
    <ul style="margin: 8px 0 0 0;">
      <li>Expanded contract analysis limits</li>
      <li>More AI chat messages per month</li>
      <li>Access to all document types</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${APP_URL}/dashboard"
       style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Get Started →
    </a>
  </div>
</body>
</html>`,
  })
}

export async function sendDeadlineReminderEmail(
  to: string,
  deadline: {
    contractName: string
    description: string
    deadlineDate: string
    daysUntil: number
    deadlineType: string
  }
) {
  const urgencyColor = deadline.daysUntil <= 7 ? '#ef4444' : deadline.daysUntil <= 30 ? '#f59e0b' : '#10b981'
  const urgencyLabel =
    deadline.daysUntil === 0
      ? 'TODAY'
      : deadline.daysUntil === 1
      ? 'TOMORROW'
      : `${deadline.daysUntil} days away`

  const formattedDate = new Date(deadline.deadlineDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Contract deadline in ${urgencyLabel}: ${deadline.contractName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">⚖️ Court of AI</h1>
    <p style="color: #6b7280; margin-top: 4px;">Contract Deadline Reminder</p>
  </div>

  <div style="background: ${urgencyColor}15; border: 2px solid ${urgencyColor}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
    <p style="margin: 0; color: ${urgencyColor}; font-size: 32px; font-weight: 700;">${urgencyLabel}</p>
    <p style="margin: 8px 0 0 0; color: #374151; font-size: 16px;">${formattedDate}</p>
  </div>

  <h2 style="font-size: 18px; margin-bottom: 8px;">${deadline.description}</h2>
  <p style="color: #6b7280; margin: 0 0 24px 0;">
    From contract: <strong>${deadline.contractName}</strong>
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${APP_URL}/deadlines"
       style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      View All Deadlines →
    </a>
  </div>

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Court of AI · <a href="${APP_URL}/settings" style="color: #9ca3af;">Manage notifications</a>
  </p>
</body>
</html>`,
  })
}

export async function sendContractAnalysisCompleteEmail(
  to: string,
  filename: string,
  riskScore: number
) {
  const riskColor = riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981'
  const riskLabel = riskScore > 70 ? 'High Risk' : riskScore > 40 ? 'Medium Risk' : 'Low Risk'

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Contract Analysis Complete: ${filename}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">⚖️ Court of AI</h1>
  </div>

  <h2>Contract Analysis Complete</h2>
  <p>Your contract <strong>${filename}</strong> has been analyzed.</p>

  <div style="text-align: center; margin: 24px 0;">
    <div style="display: inline-block; background: ${riskColor}20; border: 2px solid ${riskColor}; border-radius: 12px; padding: 16px 32px;">
      <p style="margin: 0; color: ${riskColor}; font-size: 36px; font-weight: 700;">${riskScore}</p>
      <p style="margin: 4px 0 0 0; color: ${riskColor}; font-weight: 600;">${riskLabel}</p>
    </div>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${APP_URL}/contracts"
       style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      View Full Analysis →
    </a>
  </div>
</body>
</html>`,
  })
}
