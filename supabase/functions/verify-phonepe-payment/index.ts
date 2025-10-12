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
    console.log("Verify payment request received");
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const { merchantTransactionId, transactionId } = requestBody;
    const txnId = merchantTransactionId || transactionId;

    if (!txnId) {
      throw new Error("Transaction ID is required");
    }

    console.log("Processing transaction:", txnId);

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");

    if (!merchantId || !saltKey) {
      throw new Error("PhonePe credentials not configured");
    }

    // Check payment status - Use UAT endpoint
    const statusUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${txnId}`;
    const stringToHash = `/pg/v1/status/${merchantId}/${txnId}` + saltKey;
    const sha256Hash = createHmac("sha256", saltKey).update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###1`;

    console.log("Checking payment status at:", statusUrl);
    console.log("Checksum:", checksum);

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
        "accept": "application/json"
      },
    });

    console.log("PhonePe status response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhonePe status check error:", errorText);
      throw new Error(`PhonePe status check failed: ${response.status} - ${errorText}`);
    }

    const statusResponse = await response.json();
    console.log("Payment status response:", JSON.stringify(statusResponse, null, 2));

    if (statusResponse.success && statusResponse.code === "PAYMENT_SUCCESS") {
      // Update order status
      const { error: updateError } = await supabaseService
        .from("orders")
        .update({
          status: "completed",
          razorpay_payment_id: statusResponse.data.transactionId,
        })
        .eq("razorpay_order_id", txnId);

      if (updateError) {
        console.error("Error updating order:", updateError);
        throw updateError;
      }

      // Get order details to create user purchase
      const { data: order } = await supabaseService
        .from("orders")
        .select("user_id, plan_id")
        .eq("razorpay_order_id", txnId)
        .single();

      if (order) {
        // Get plan details
        const { data: plan } = await supabaseService
          .from("plans")
          .select("type")
          .eq("id", order.plan_id)
          .single();

        // Create user purchase
        await supabaseService
          .from("user_purchases")
          .insert({
            user_id: order.user_id,
            plan_id: order.plan_id,
            tier: plan?.type || "basic",
            payment_id: statusResponse.data.transactionId,
            is_active: true,
          });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Payment verified successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: "Payment verification failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error in verify-phonepe-payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
