-- Setup pg_cron for welcome emails processing
-- This migration configures automatic execution of welcome email processing

-- Enable pg_cron extension (must be enabled in Supabase dashboard first)
-- Go to: Project Settings > Database > Extensions > Enable pg_cron

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create function to call the Edge Function
CREATE OR REPLACE FUNCTION process_welcome_emails_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the Edge Function URL and service key
  edge_function_url := 'https://' || current_setting('app.project_ref') || '.supabase.co/functions/v1/send-welcome-emails';
  service_role_key := current_setting('app.jwt_secret');

  -- Call the Edge Function via HTTP POST
  PERFORM
    net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Schedule the cron job to run every 5 minutes
-- Remove any existing job first
SELECT cron.unschedule('process-welcome-emails');

-- Schedule new job
SELECT cron.schedule(
  'process-welcome-emails',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT process_welcome_emails_cron();'
);

-- Optional: Log cron job executions (uncomment if needed)
-- CREATE TABLE IF NOT EXISTS cron_job_logs (
--   id SERIAL PRIMARY KEY,
--   job_name TEXT NOT NULL,
--   executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   success BOOLEAN,
--   error_message TEXT
-- );

-- INSERT INTO cron_job_logs (job_name, success)
-- SELECT 'process-welcome-emails', true
-- WHERE cron.schedule('process-welcome-emails', '*/5 * * * *', 'SELECT process_welcome_emails_cron();') IS NOT NULL;