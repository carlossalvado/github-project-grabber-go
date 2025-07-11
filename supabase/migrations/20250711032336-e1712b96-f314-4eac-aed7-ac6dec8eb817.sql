-- Migração completa para PayPal: renomear stripe_price_id para paypal_plan_id

-- Atualizar tabela plans
ALTER TABLE public.plans RENAME COLUMN stripe_price_id TO paypal_plan_id;

-- Atualizar tabela audio_credit_products  
ALTER TABLE public.audio_credit_products RENAME COLUMN stripe_price_id TO paypal_plan_id;

-- Atualizar tabela voice_credit_products
ALTER TABLE public.voice_credit_products RENAME COLUMN stripe_price_id TO paypal_plan_id;

-- Atualizar tabela gifts
ALTER TABLE public.gifts RENAME COLUMN stripe_price_id TO paypal_plan_id;

-- Renomear stripe_session_id para paypal_session_id nas transações
ALTER TABLE public.audio_credit_transactions RENAME COLUMN stripe_session_id TO paypal_session_id;
ALTER TABLE public.voice_credit_transactions RENAME COLUMN stripe_session_id TO paypal_session_id;

-- Atualizar dados existentes nos planos com IDs do PayPal (usando plan_id como referência)
UPDATE public.plans SET paypal_plan_id = 'P-5ML4271244454362WXNWU5NQ' WHERE id = 1;
UPDATE public.plans SET paypal_plan_id = 'P-5ML4271244454362WXNWU5NQ' WHERE id = 2; 
UPDATE public.plans SET paypal_plan_id = 'P-5ML4271244454362WXNWU5NQ' WHERE id = 3;
UPDATE public.plans SET paypal_plan_id = 'P-5ML4271244454362WXNWU5NQ' WHERE id = 4;