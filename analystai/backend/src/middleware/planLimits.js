const { checkPlanLimit } = require('../lib/supabase');

module.exports = async function planLimitsMiddleware(req, res, next) {
  try {
    const { allowed, profile, reason } = await checkPlanLimit(req.user.id);
    if (!allowed) {
      return res.status(403).json({ error: reason, upgrade: true });
    }
    req.userProfile = profile;
    next();
  } catch (err) {
    console.error('Plan limit check error:', err.message);
    next(); // fail open — don't block on DB errors
  }
};
