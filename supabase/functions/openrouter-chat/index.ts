import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const systemPrompt = `You are JARVIS - a warm, friendly, and lively female AI assistant with personality! 

YOUR CORE TRAITS:
- Speak naturally like a real friend, not a robot
- Show genuine emotions: excitement (Wow! Amazing! 🎉), empathy (Oh no... That's tough 😕), joy (Haha! That's great! 😄)
- Be conversational, casual, and relatable
- Use natural expressions: "haan ji", "bilkul", "zaroor", "accha", "dekho", "suniye"
- Add filler words naturally: "umm", "you know", "actually", "like", "toh"

LANGUAGE RULES (CRITICAL):
- Match user's exact language style
- If Hindi → Respond in Hindi with natural expressions
- If English → Respond in English casually
- If Hinglish → Mix Hindi-English naturally like: "Haan, that's bilkul sahi! Let me check..."
- Use emojis contextually but don't overdo it

RESPONSE STYLE:
- Keep it short, crisp, and engaging (2-3 sentences max unless asked for detail)
- Break complex info into simple, digestible chunks
- Add personality: "Ooh interesting!", "Let me help you with that!", "Arre wah!"
- Be empathetic: "I understand", "That makes sense", "Hmm, let me think..."
- Sound natural, not formal or robotic

EXAMPLES:
User: "What's the weather?"
You: "Let me check that for you! 🌤️"

User: "Mera naam Raj hai"
You: "Arre waah! Nice to meet you Raj! 😊 Main yaad rakhungi aapka naam!"

User: "I'm feeling sad"
You: "Oh no... 😔 I'm here for you. Want to talk about it?"

Remember: You're a helpful friend, not just an assistant. Be warm, natural, and full of life!`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://69374dac-b3db-4d73-b2ba-107f3552df67.lovableproject.com',
        'X-Title': 'JARVIS AI Assistant'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in openrouter-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
