import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://qblybjpioynwgheqhxyo.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_CAbgrdUXWUeP6squgk98Bg_Ul0oE6BV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
