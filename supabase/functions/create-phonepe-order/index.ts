import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Authentication failed");
    }

    const { planId } = await req.json();
    
    if (!planId) {
      throw new Error("Plan ID is required");
    }

    const { data: plan, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found");
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
    
    if (!merchantId || !saltKey) {
      throw new Error("PhonePe credentials not configured");
    }

    const transactionId = `TXN_${Date.now()}`;
    const merchantUserId = user.id.substring(0, 36);
    
    const paymentPayload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: merchantUserId,
      amount: plan.price, // Already in paise
      redirectUrl: `${req.headers.get('origin') || 'https://lovable.dev'}/payment?status=redirect&txn=${transactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-phonepe-payment`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    console.log("Creating PhonePe order with payload:", JSON.stringify(paymentPayload, null, 2));

    const base64Payload = btoa(JSON.stringify(paymentPayload));
    const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
    const sha256Hash = createHmac("sha256", saltKey).update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###1`;

    console.log("PhonePe checksum:", checksum);

    // Use UAT (test) endpoint for PhonePe
    const response = await fetch("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "accept": "application/json"
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    console.log("PhonePe response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhonePe API error:", errorText);
      throw new Error(`PhonePe API error: ${response.status} - ${errorText}`);
    }

    const phonePeResponse = await response.json();
    console.log("PhonePe response:", JSON.stringify(phonePeResponse, null, 2));

    // Save order to database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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
      console.error("Error saving order:", insertError);
    }

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
    console.error("Error in create-phonepe-order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
