import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query parameter');
    }

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    console.log('Processing search query:', query);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful search assistant. Provide accurate and concise information based on the query. Format your response in a clear and easy-to-read manner.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || 'No response generated';

    return new Response(
      JSON.stringify({ result }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in deepseek-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});