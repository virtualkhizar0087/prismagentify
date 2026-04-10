/**
 * LivePK — Email Service
 * Handles all transactional emails via Nodemailer
 */

const nodemailer = require('nodemailer');

// ── Create transporter ──
const createTransporter = () => {
  // Use Gmail SMTP (or any SMTP)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Gmail App Password
      }
    });
  }

  // Default: SMTP (works with any provider)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// ── Brand colors & styles ──
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #E53E3E, #C53030); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.85); margin: 5px 0 0; font-size: 14px; }
    .body { padding: 35px 40px; }
    .body h2 { color: #1a1a1a; margin-top: 0; }
    .body p { color: #555; line-height: 1.7; }
    .btn { display: inline-block; background: #E53E3E; color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .otp-box { background: #FFF5F5; border: 2px dashed #E53E3E; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-box .otp { font-size: 40px; font-weight: bold; color: #E53E3E; letter-spacing: 8px; }
    .footer { background: #f8f8f8; padding: 20px 40px; text-align: center; border-top: 1px solid #eee; }
    .footer p { color: #999; font-size: 12px; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .warning { background: #FFF3CD; border-left: 4px solid #FFC107; padding: 12px 16px; border-radius: 4px; color: #856404; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔴 LivePK</h1>
      <p>Pakistan's Live Commerce Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} LivePK — Pakistan Live Commerce Platform</p>
      <p>Lahore, Pakistan | support@livepk.pk</p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

// ══════════════════════════════════════════
// Send Email Verification
// ══════════════════════════════════════════
exports.sendVerificationEmail = async (user, verificationToken) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Welcome to LivePK! Please verify your email address to complete your registration and start shopping or selling live.</p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="btn">✅ Verify Email</a>
    </div>
    <hr class="divider">
    <p style="font-size: 13px; color: #888;">Or copy this link into your browser:</p>
    <p style="font-size: 12px; color: #aaa; word-break: break-all;">${verifyUrl}</p>
    <div class="warning">⏳ This link expires in <strong>24 hours</strong>.</div>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LivePK" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '✅ Verify Your LivePK Email',
    html: emailTemplate(content)
  });
};

// ══════════════════════════════════════════
// Send Password Reset Email
// ══════════════════════════════════════════
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>We received a request to reset your LivePK password. Click the button below to create a new password.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
    </div>
    <hr class="divider">
    <p style="font-size: 13px; color: #888;">Or copy this link into your browser:</p>
    <p style="font-size: 12px; color: #aaa; word-break: break-all;">${resetUrl}</p>
    <div class="warning">⚠️ This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email — your account is safe.</div>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LivePK" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '🔑 Reset Your LivePK Password',
    html: emailTemplate(content)
  });
};

// ══════════════════════════════════════════
// Send Order Confirmation
// ══════════════════════════════════════════
exports.sendOrderConfirmation = async (user, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">PKR ${item.total?.toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your order has been placed successfully. Here are the details:</p>
    <div class="otp-box" style="text-align: left; padding: 16px;">
      <strong>Order #${order.orderNumber}</strong><br>
      <span style="color: #888; font-size: 14px;">Payment: ${order.paymentMethod.toUpperCase()} | Status: ${order.status.toUpperCase()}</span>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #f8f8f8;">
          <th style="padding: 10px; text-align: left; font-size: 13px;">Item</th>
          <th style="padding: 10px; text-align: center; font-size: 13px;">Qty</th>
          <th style="padding: 10px; text-align: right; font-size: 13px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
          <td style="padding: 10px; text-align: right; font-weight: bold; color: #E53E3E;">PKR ${order.totalAmount?.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    <p><strong>Delivery to:</strong> ${order.shippingAddress?.address}, ${order.shippingAddress?.city}</p>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="btn">📦 Track Order</a>
    </div>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LivePK" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🎉 Order Confirmed — ${order.orderNumber}`,
    html: emailTemplate(content)
  });
};

// ══════════════════════════════════════════
// Send Welcome Email
// ══════════════════════════════════════════
exports.sendWelcomeEmail = async (user) => {
  const roleContent = {
    buyer: `Start exploring live streams and shop from Pakistan's best sellers — all with easy COD delivery!`,
    seller: `Set up your store, add products, and go live to sell directly to thousands of buyers across Pakistan!`,
    influencer: `Connect with sellers, promote products in live streams, and earn commissions on every sale you drive!`
  };

  const content = `
    <h2>Welcome to LivePK! 🎉</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your account is ready. ${roleContent[user.role] || roleContent.buyer}</p>
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL}" class="btn">🚀 Get Started</a>
    </div>
    <hr class="divider">
    <p style="color: #888; font-size: 13px;">Need help? Contact us at <a href="mailto:support@livepk.pk">support@livepk.pk</a></p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"LivePK" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `🎉 Welcome to LivePK, ${user.name}!`,
    html: emailTemplate(content)
  });
};
