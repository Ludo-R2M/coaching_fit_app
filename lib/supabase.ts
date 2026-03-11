import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sxevqdhwynnolcdkuqhx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZXZxZGh3eW5ub2xjZGt1cWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjAwOTYsImV4cCI6MjA4ODYzNjA5Nn0.DsYDoBbU3cIhHduxIeFLZXvuRsiux9NctPcR1DG8qrQ';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();
