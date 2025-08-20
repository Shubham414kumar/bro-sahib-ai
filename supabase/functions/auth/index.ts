import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, password, fullName } = await req.json()
    console.log(`Auth action: ${action} for email: ${email}`)

    if (action === 'signup') {
      // Create new user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        user_metadata: {
          full_name: fullName
        },
        email_confirm: true // Auto-confirm for development
      })

      if (authError) {
        console.error('Signup error:', authError)
        return new Response(
          JSON.stringify({ 
            error: true, 
            message: authError.message === 'User already registered' 
              ? 'Email already exist karta hai. Login karo.' 
              : authError.message 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: true, message: 'User creation failed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      // Create profile
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          full_name: fullName,
          avatar_url: null
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail signup if profile creation fails, user can still login
      }

      console.log('Signup successful for:', email)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Account ban gaya! Ab login kar sakte hain.',
          user: {
            id: authData.user.id,
            email: authData.user.email,
            name: fullName
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else if (action === 'login') {
      // Sign in user
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      })

      if (authError) {
        console.error('Login error:', authError)
        let message = 'Login failed'
        
        if (authError.message.includes('Invalid login credentials')) {
          message = 'Email ya password galat hai'
        } else if (authError.message.includes('Email not confirmed')) {
          message = 'Email confirm nahi hai'
        }

        return new Response(
          JSON.stringify({ error: true, message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      if (!authData.user) {
        return new Response(
          JSON.stringify({ error: true, message: 'Login failed - no user' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      // Get user profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      const userData = {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User'
      }

      console.log('Login successful for:', email)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Welcome ${userData.name}! JARVIS ready hai.`,
          user: userData,
          session: authData.session
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else {
      return new Response(
        JSON.stringify({ error: true, message: 'Invalid action' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

  } catch (error) {
    console.error('Auth function error:', error)
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: 'Server error: ' + error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})