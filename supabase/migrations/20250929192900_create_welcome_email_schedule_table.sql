-- Create welcome_email_schedule table for scheduling welcome emails
CREATE TABLE IF NOT EXISTS welcome_email_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  trial_day INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on scheduled_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_welcome_email_schedule_scheduled_at ON welcome_email_schedule(scheduled_at);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_welcome_email_schedule_user_id ON welcome_email_schedule(user_id);

-- Add RLS (Row Level Security)
ALTER TABLE welcome_email_schedule ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage schedules
CREATE POLICY "Allow service role to manage welcome email schedules" ON welcome_email_schedule
  FOR ALL USING (auth.role() = 'service_role');

-- Policy to allow users to view their own email schedules
CREATE POLICY "Users can view their own email schedules" ON welcome_email_schedule
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow service role to insert schedules (for signup process)
CREATE POLICY "Service role can insert email schedules" ON welcome_email_schedule
  FOR INSERT WITH CHECK (auth.role() = 'service_role');