import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Guard against missing env vars during development (app still loads, auth features disabled)
const supabase = (url && url.startsWith('http') && key)
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-key-add-env-vars');

export default supabase;
