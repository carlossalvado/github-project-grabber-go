-- Fix RLS permissions for trial and email tables

-- Allow service role to manage user_trials
CREATE POLICY "Service role can manage user trials" ON public.user_trials
  FOR ALL USING (auth.role() = 'service_role');

-- Allow service role to manage welcome_email_schedule (additional policy)
CREATE POLICY "Service role can update email schedules" ON welcome_email_schedule
  FOR UPDATE USING (auth.role() = 'service_role');

-- Grant execute permission on start_trial function to authenticated users
GRANT EXECUTE ON FUNCTION public.start_trial(UUID) TO authenticated;

-- Grant execute permission on is_trial_active function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_trial_active(UUID) TO authenticated;