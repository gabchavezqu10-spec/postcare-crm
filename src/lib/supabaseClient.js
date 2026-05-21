import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jfugxwjujllfqcfhsiua.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWd4d2p1amxsZnFjZmhzaXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzE3ODIsImV4cCI6MjA5NDk0Nzc4Mn0.d1Yf5DIB6aRNXZTctn56FQkmYPFY5j0C5IXBvcsvbM8';

export const supabase = createClient(supabaseUrl, supabaseKey);
