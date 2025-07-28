import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ohigiedhjuqdlbohvssp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaWdpZWRoanVxZGxib2h2c3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1Mjc0OTEsImV4cCI6MjA2OTEwMzQ5MX0.l2WZxLVdDoqEgYEOFxZNz8IfLVoYFyI4a9rhJc5DAM8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})