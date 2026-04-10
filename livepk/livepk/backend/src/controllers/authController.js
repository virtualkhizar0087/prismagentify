const User = require('../models/User');
const { generateTokens } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// ══════════════════════════════════════════
// POST /api/auth/register
// ══════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password, role, city } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, ...(phone ? [{ phone }] : [])]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone number';
      return res.status(400).json({ success: false, message: `This ${field} is already registered.` });
    }

    const allowedRoles = ['buyer', 'seller', 'influencer'];
    const userRole = allowedRoles.includes(role) ? role : 'buyer';

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({
      name, email, phone, password,
      role: userRole,
      city: city || 'Lahore',
      emailVerificationToken,
      emailVerificationExpires
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Send emails (non-blocking)
    emailService.sendVerificationEmail(user, emailVerificationToken).catch(console.error);
    emailService.sendWelcomeEmail(user).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      data: { user: user.toPublicJSON(), accessToken, refreshToken }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact support@livepk.pk' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: { user: user.toPublicJSON(), accessToken, refreshToken }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/verify-email
// ══════════════════════════════════════════
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token required.' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token. Please request a new one.' });
    }

    user.emailVerified = true;
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully! Your account is now fully active.' });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Email verification failed.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/resend-verification
// ══════════════════════════════════════════
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.emailVerified) {
      return res.json({ success: true, message: 'If this email is registered and unverified, a link has been sent.' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await emailService.sendVerificationEmail(user, emailVerificationToken);

    res.json({ success: true, message: 'Verification email sent! Check your inbox.' });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification email.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/forgot-password
// ══════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: 'If this email is registered, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({ success: true, message: 'Password reset link sent to your email.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset email.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/reset-password
// ══════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token. Please request a new one.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/change-password
// ══════════════════════════════════════════
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Password change failed.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/refresh
// ══════════════════════════════════════════
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, data: tokens });

  } catch (error) {
    res.status(401).json({ success: false, message: 'Token refresh failed.' });
  }
};

// ══════════════════════════════════════════
// POST /api/auth/logout
// ══════════════════════════════════════════
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

// ══════════════════════════════════════════
// GET /api/auth/me
// ══════════════════════════════════════════
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user.' });
  }
};

// ══════════════════════════════════════════
// PUT /api/auth/update-profile
// ══════════════════════════════════════════
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'bio', 'city', 'notificationPreferences'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.user.role === 'seller' && req.body.sellerProfile) {
      const sp = req.body.sellerProfile;
      ['storeName', 'storeDescription', 'category'].forEach(f => {
        if (sp[f]) updates[`sellerProfile.${f}`] = sp[f];
      });
    }

    if (req.user.role === 'influencer' && req.body.influencerProfile) {
      const ip = req.body.influencerProfile;
      ['handle', 'niche', 'platforms'].forEach(f => {
        if (ip[f]) updates[`influencerProfile.${f}`] = ip[f];
      });
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', data: user.toPublicJSON() });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
};
