const { createClient } = require('@supabase/supabase-js');

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('http')) {
      throw new Error('SUPABASE_URL is not configured in .env');
    }
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _supabase;
}

// Proxy object — behaves like the client but initializes lazily
const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  }
});

// Plan daily limits (-1 = unlimited)
const PLAN_LIMITS = {
  free: 3,       // 3 total lifetime (tracked via total_analyses)
  starter: 5,    // 5 per day
  pro: -1,
  enterprise: -1,
};

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function resetDailyCountIfNeeded(userId, profile) {
  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_reset_date !== today) {
    const { data } = await supabase
      .from('profiles')
      .update({ analyses_today: 0, last_reset_date: today })
      .eq('id', userId)
      .select()
      .single();
    return data || { ...profile, analyses_today: 0, last_reset_date: today };
  }
  return profile;
}

async function checkPlanLimit(userId) {
  let profile = await getProfile(userId);
  profile = await resetDailyCountIfNeeded(userId, profile);

  const limit = PLAN_LIMITS[profile.plan] ?? 3;
  if (limit === -1) return { allowed: true, profile };

  if (profile.plan === 'free') {
    // Free: lifetime cap of 3
    if (profile.total_analyses >= limit) {
      return { allowed: false, profile, reason: `Free tier limit reached (${limit} analyses). Please upgrade to continue.` };
    }
  } else {
    // Paid: daily cap
    if (profile.analyses_today >= limit) {
      return { allowed: false, profile, reason: `Daily limit reached (${limit}/day on ${profile.plan} plan). Resets at midnight.` };
    }
  }

  return { allowed: true, profile };
}

async function incrementAnalysisCount(userId) {
  await supabase.rpc('increment_analysis_count', { uid: userId }).catch(() => {
    // Fallback if RPC not set up
    supabase.from('profiles')
      .select('analyses_today, total_analyses')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase.from('profiles').update({
            analyses_today: (data.analyses_today || 0) + 1,
            total_analyses: (data.total_analyses || 0) + 1,
          }).eq('id', userId);
        }
      });
  });
}

async function saveAnalysis(userId, module, input, result) {
  const { error } = await supabase.from('analyses').insert({
    user_id: userId,
    module,
    input,
    result,
  });
  if (error) console.error('Save analysis error:', error.message);
}

async function updateUserPlan(userId, plan, stripeCustomerId, stripeSubscriptionId) {
  const { error } = await supabase.from('profiles').update({
    plan,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
  }).eq('id', userId);
  if (error) console.error('Update plan error:', error.message);
}

async function getUserByEmail(email) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  return data;
}

module.exports = {
  supabase,
  PLAN_LIMITS,
  getProfile,
  checkPlanLimit,
  incrementAnalysisCount,
  saveAnalysis,
  updateUserPlan,
  getUserByEmail,
};
