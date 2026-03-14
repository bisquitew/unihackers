import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dztqagqmnqvrqryraish.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_dGzDWca08Cci6vc_cfueMg_90H1XbTo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
