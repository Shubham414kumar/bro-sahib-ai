import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Automation {
  id: string;
  user_id: string;
  name: string;
  type: 'daily' | 'recurring' | 'reminder' | 'webhook';
  schedule_time?: string;
  interval_minutes?: number;
  reminder_datetime?: string;
  action_type: 'notification' | 'search' | 'command' | 'webhook';
  action_data: {
    title?: string;
    message?: string;
    query?: string;
    command?: string;
    url?: string;
  };
  is_active: boolean;
  next_run?: string;
  last_run?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    console.log(`Processing automations at ${now.toISOString()}`);

    // Get all active automations that need to run
    const { data: automations, error: fetchError } = await supabase
      .from('custom_automations')
      .select('*')
      .eq('is_active', true)
      .lte('next_run', now.toISOString());

    if (fetchError) {
      console.error('Error fetching automations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${automations?.length || 0} automations to process`);

    const results = [];

    for (const automation of (automations || [])) {
      const startTime = Date.now();
      let status: 'success' | 'failed' | 'skipped' = 'success';
      let errorMessage: string | undefined;
      let resultData: any = {};

      try {
        console.log(`Processing automation: ${automation.name} (${automation.id})`);

        // Execute the automation action
        switch (automation.action_type) {
          case 'notification':
            resultData = {
              title: automation.action_data.title,
              message: automation.action_data.message,
              sent: true
            };
            console.log(`Notification automation processed: ${automation.name}`);
            break;

          case 'search':
            // Web search would be handled by the client or another service
            resultData = {
              query: automation.action_data.query,
              triggered: true
            };
            console.log(`Search automation triggered: ${automation.action_data.query}`);
            break;

          case 'command':
            // Commands would be handled by the client
            resultData = {
              command: automation.action_data.command,
              triggered: true
            };
            console.log(`Command automation triggered: ${automation.action_data.command}`);
            break;

          case 'webhook':
            if (automation.action_data.url) {
              const webhookResponse = await fetch(automation.action_data.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  automation_id: automation.id,
                  automation_name: automation.name,
                  triggered_at: now.toISOString()
                })
              });
              resultData = {
                url: automation.action_data.url,
                status: webhookResponse.status,
                success: webhookResponse.ok
              };
            }
            break;

          default:
            status = 'skipped';
            errorMessage = 'Unknown action type';
        }

        // Calculate next run time
        const nextRun = calculateNextRun(automation, now);

        // Update automation
        const { error: updateError } = await supabase
          .from('custom_automations')
          .update({
            last_run: now.toISOString(),
            next_run: nextRun
          })
          .eq('id', automation.id);

        if (updateError) {
          console.error(`Error updating automation ${automation.id}:`, updateError);
          status = 'failed';
          errorMessage = updateError.message;
        }

      } catch (error) {
        console.error(`Error executing automation ${automation.id}:`, error);
        status = 'failed';
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }

      // Log execution
      const executionDuration = Date.now() - startTime;
      const { error: logError } = await supabase
        .from('automation_logs')
        .insert({
          automation_id: automation.id,
          user_id: automation.user_id,
          execution_time: now.toISOString(),
          status,
          result_data: resultData,
          error_message: errorMessage,
          execution_duration_ms: executionDuration
        });

      if (logError) {
        console.error(`Error logging execution for ${automation.id}:`, logError);
      }

      results.push({
        automation_id: automation.id,
        automation_name: automation.name,
        status,
        duration_ms: executionDuration
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Process automations error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function calculateNextRun(automation: Automation, currentTime: Date): string | null {
  if (automation.type === 'daily' && automation.schedule_time) {
    const [hours, minutes] = automation.schedule_time.split(':').map(Number);
    const nextRun = new Date(currentTime);
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextRun <= currentTime) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    return nextRun.toISOString();
  } else if (automation.type === 'recurring' && automation.interval_minutes) {
    const nextRun = new Date(currentTime.getTime() + automation.interval_minutes * 60000);
    return nextRun.toISOString();
  } else if (automation.type === 'reminder' && automation.reminder_datetime) {
    // One-time reminder, set to null after execution
    return null;
  }
  
  return null;
}
