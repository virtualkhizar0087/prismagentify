const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { supabase, getProfile } = require('../lib/supabase');

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await getProfile(req.user.id);

    // Reset daily count if new day
    const today = new Date().toISOString().slice(0, 10);
    if (profile.last_reset_date !== today) {
      const { data } = await supabase
        .from('profiles')
        .update({ analyses_today: 0, last_reset_date: today })
        .eq('id', req.user.id)
        .select()
        .single();
      return res.json({ success: true, profile: data });
    }

    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/user/history
router.get('/history', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('id, module, input, result, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ success: true, analyses: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
