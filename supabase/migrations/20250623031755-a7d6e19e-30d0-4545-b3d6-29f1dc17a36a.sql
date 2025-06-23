
-- Add social media fields to the ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS kwai_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS bio text;

-- Update Isa's profile with sample data (you can modify these URLs)
UPDATE public.ai_agents 
SET 
  bio = 'Olá! Sou a Isa, sua assistente virtual favorita. Adoro conversar sobre tudo e estou sempre aqui para te ajudar!',
  tiktok_url = 'https://tiktok.com/@isa_virtual',
  kwai_url = 'https://kwai.com/@isa_virtual', 
  facebook_url = 'https://facebook.com/isa.virtual',
  instagram_url = 'https://instagram.com/isa_virtual'
WHERE name = 'Isa';
