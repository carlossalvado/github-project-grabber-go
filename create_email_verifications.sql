-- Script para criar a tabela email_verifications
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- Create email_verifications table for storing verification codes
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Add RLS (Row Level Security)
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow insert for anyone (needed for signup)
CREATE POLICY "Allow insert for email verifications" ON email_verifications
  FOR INSERT WITH CHECK (true);

-- Policy to allow select for verification (anyone can verify their own email)
CREATE POLICY "Allow select for email verification" ON email_verifications
  FOR SELECT USING (true);

-- Policy to allow update for service role only (to mark codes as used)
CREATE POLICY "Allow update for service role" ON email_verifications
  FOR UPDATE USING (auth.role() = 'service_role');

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_verifications
  WHERE expires_at < NOW();
END;
$$;

-- Create a trigger to automatically clean up expired codes (runs every hour)
-- Note: In production, you might want to use a cron job instead
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_verifications()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clean up expired codes when inserting new ones
  PERFORM cleanup_expired_verifications();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_on_insert
  AFTER INSERT ON email_verifications
  EXECUTE FUNCTION trigger_cleanup_expired_verifications();