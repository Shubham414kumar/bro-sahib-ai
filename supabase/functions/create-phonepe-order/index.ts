import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

console.log('🚀 create-phonepe-order function loaded');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📥 Received request to create PhonePe order');

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error('❌ No authorization header');
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      throw new Error("Authentication failed");
    }

    console.log('👤 User authenticated:', user.id);

    const { planId } = await req.json();
    
    console.log('📋 Plan ID:', planId);
    
    if (!planId) {
      console.error('❌ Missing plan ID');
      throw new Error("Plan ID is required");
    }

    // Get plan details
    console.log('🔍 Fetching plan details...');
    const { data: plan, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError);
      throw new Error("Plan not found");
    }

    console.log('✅ Plan found:', plan.name, '- ₹', plan.price);

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
    
    console.log('🔑 PhonePe Merchant ID:', merchantId ? 'Configured' : 'Missing');
    console.log('🔑 PhonePe Salt Key:', saltKey ? 'Configured' : 'Missing');
    
    if (!merchantId || !saltKey) {
      console.error('❌ PhonePe credentials not configured');
      throw new Error("PhonePe credentials not configured. Please add PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY in Supabase secrets");
    }

    const transactionId = `JARVIS_${Date.now()}_${user.id.substring(0, 8)}`;
    const merchantUserId = user.id.substring(0, 36);
    
    console.log('🆔 Transaction ID:', transactionId);
    
    const paymentPayload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: merchantUserId,
      amount: plan.price, // Already in paise
      redirectUrl: `${req.headers.get('origin') || 'https://preview--bro-sahib-ai.lovable.app'}/payment-verification?transactionId=${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-phonepe-payment`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    console.log("💳 Creating PhonePe order with payload:", JSON.stringify(paymentPayload, null, 2));

    // Create service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Save payment history (initiated)
    console.log('💾 Saving payment history (initiated)...');
    const { error: historyError } = await supabaseService
      .from('payment_history')
      .insert({
        user_id: user.id,
        plan_id: planId,
        payment_method: 'phonepe',
        transaction_id: transactionId,
        amount: plan.price,
        currency: plan.currency || 'INR',
        status: 'initiated',
        payment_data: paymentPayload
      });

    if (historyError) {
      console.error('⚠️ Failed to save payment history:', historyError);
    } else {
      console.log('✅ Payment history saved');
    }

    // Generate checksum
    const base64Payload = btoa(JSON.stringify(paymentPayload));
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256Hash = createHmac("sha256", saltKey).update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###1`;

    console.log("🔐 Checksum generated:", checksum.substring(0, 20) + "...");

    // Call PhonePe API (UAT/test endpoint)
    console.log('📡 Calling PhonePe API...');
    const response = await fetch("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "accept": "application/json"
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    console.log("📨 PhonePe response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PhonePe API error:", errorText);
      
      // Update payment history with error
      await supabaseService
        .from('payment_history')
        .update({ 
          status: 'failed',
          error_message: errorText
        })
        .eq('transaction_id', transactionId);
      
      throw new Error(`PhonePe API error: ${response.status} - ${errorText}`);
    }

    const phonePeResponse = await response.json();
    console.log("✅ PhonePe response:", JSON.stringify(phonePeResponse, null, 2));

    // Update payment history to pending
    console.log('💾 Updating payment history (pending)...');
    await supabaseService
      .from('payment_history')
      .update({ 
        status: 'pending',
        payment_data: phonePeResponse
      })
      .eq('transaction_id', transactionId);

    // Save order to database
    console.log('💾 Saving order...');
    const { error: insertError } = await supabaseService
      .from("orders")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        razorpay_order_id: transactionId,
        amount: plan.price,
        currency: plan.currency || "INR",
        status: "pending",
      });

    if (insertError) {
      console.error("⚠️ Error saving order:", insertError);
    } else {
      console.log('✅ Order saved');
    }

    console.log('✅ PhonePe order created successfully');
    return new Response(
      JSON.stringify({
        success: true,
        data: phonePeResponse.data,
        transactionId: transactionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Exception in create-phonepe-order:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

console.log('✅ create-phonepe-order function ready');