import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

console.log('🚀 verify-phonepe-payment function loaded');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("📥 Received payment verification request");

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const { merchantTransactionId, transactionId } = requestBody;
    const txnId = merchantTransactionId || transactionId;

    console.log('🆔 Transaction ID:', txnId);

    if (!txnId) {
      console.error('❌ Missing transaction ID');
      throw new Error("Transaction ID is required");
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");

    console.log('🔑 PhonePe Merchant ID:', merchantId ? 'Configured' : 'Missing');

    if (!merchantId || !saltKey) {
      console.error('❌ PhonePe credentials not configured');
      throw new Error("PhonePe credentials not configured");
    }

    // Check payment status - Use UAT endpoint
    const statusUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${txnId}`;
    const stringToHash = `/pg/v1/status/${merchantId}/${txnId}` + saltKey;
    const sha256Hash = createHmac("sha256", saltKey).update(stringToHash).digest("hex");
    const checksum = `${sha256Hash}###1`;

    console.log("📡 Checking payment status at:", statusUrl);
    console.log("🔐 Checksum:", checksum.substring(0, 20) + "...");

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
        "accept": "application/json"
      },
    });

    console.log("📨 PhonePe status response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PhonePe status check error:", errorText);
      
      // Update payment history with error
      await supabaseService
        .from('payment_history')
        .update({ 
          status: 'failed',
          error_message: errorText
        })
        .eq('transaction_id', txnId);
      
      throw new Error(`PhonePe status check failed: ${response.status} - ${errorText}`);
    }

    const statusResponse = await response.json();
    console.log("✅ Payment status response:", JSON.stringify(statusResponse, null, 2));

    const isSuccess = statusResponse.success && statusResponse.code === "PAYMENT_SUCCESS";
    console.log('💰 Payment Status:', isSuccess ? 'SUCCESS' : 'FAILED');

    if (isSuccess) {
      // Get order details to find plan_id
      console.log('🔍 Fetching order details...');
      const { data: order, error: orderError } = await supabaseService
        .from("orders")
        .select("user_id, plan_id")
        .eq("razorpay_order_id", txnId)
        .single();

      if (orderError || !order) {
        console.error('❌ Order not found:', orderError);
        throw new Error("Order not found");
      }

      console.log('✅ Order found for user:', order.user_id);

      // Update payment history
      console.log('💾 Updating payment history (completed)...');
      await supabaseService
        .from('payment_history')
        .update({ 
          status: 'completed',
          payment_data: statusResponse
        })
        .eq('transaction_id', txnId);

      // Update order status
      console.log('💾 Updating order status...');
      const { error: updateError } = await supabaseService
        .from("orders")
        .update({
          status: "completed",
          razorpay_payment_id: statusResponse.data.transactionId,
        })
        .eq("razorpay_order_id", txnId);

      if (updateError) {
        console.error("⚠️ Error updating order:", updateError);
        throw updateError;
      }

      // Get plan details
      console.log('🔍 Fetching plan details...');
      const { data: plan } = await supabaseService
        .from("plans")
        .select("type")
        .eq("id", order.plan_id)
        .single();

      // Create user purchase
      console.log('💾 Creating user purchase record...');
      const { error: purchaseError } = await supabaseService
        .from("user_purchases")
        .insert({
          user_id: order.user_id,
          plan_id: order.plan_id,
          tier: plan?.type || "premium",
          payment_id: statusResponse.data.transactionId,
          is_active: true,
        });

      if (purchaseError) {
        console.error('⚠️ Failed to create purchase record:', purchaseError);
      } else {
        console.log('✅ Purchase record created');
      }

      console.log('✅ Payment verified successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment verified successfully",
          paymentData: statusResponse.data
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.log('⚠️ Payment not successful');
      
      // Update payment history
      await supabaseService
        .from('payment_history')
        .update({ 
          status: 'failed',
          error_message: 'Payment not completed',
          payment_data: statusResponse
        })
        .eq('transaction_id', txnId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment verification failed",
          paymentData: statusResponse.data
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("❌ Exception in verify-phonepe-payment:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
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

console.log('✅ verify-phonepe-payment function ready');