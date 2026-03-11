import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://sxevqdhwynnolcdkuqhx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZXZxZGh3eW5ub2xjZGt1cWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjAwOTYsImV4cCI6MjA4ODYzNjA5Nn0.DsYDoBbU3cIhHduxIeFLZXvuRsiux9NctPcR1DG8qrQ'
);
