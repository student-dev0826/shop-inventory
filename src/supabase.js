import {createClient} from '@supabase/supabase-js';
// Frontend-safe config only: project URL + anon/publishable key, read from Vite env vars (never hard-coded).
const url=import.meta.env.VITE_SUPABASE_URL?.trim(),key=import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
let client=null;
try{if(url&&key)client=createClient(url,key)}catch{console.error('Invalid Supabase configuration. Check VITE_SUPABASE_URL.')}
export const supabase=client;
