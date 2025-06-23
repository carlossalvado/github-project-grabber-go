
-- Criar tabela para configurações de créditos por plano
CREATE TABLE public.plan_credits_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  initial_audio_credits INTEGER NOT NULL DEFAULT 0,
  initial_voice_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir configurações para os planos
INSERT INTO public.plan_credits_config (plan_name, initial_audio_credits, initial_voice_credits) VALUES
('Text & Audio', 10, 2),
('Trial', 10, 2),
('Free Plan', 0, 0);

-- Atualizar a função handle_new_user_credits para usar as configurações
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Dar 10 créditos de áudio iniciais para todos os novos usuários
  INSERT INTO public.user_audio_credits (user_id, credits)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.audio_credit_transactions (user_id, transaction_type, amount, description)
  VALUES (NEW.id, 'purchase', 10, 'Créditos iniciais grátis');
  
  RETURN NEW;
END;
$function$;

-- Criar função para dar créditos baseado no plano
CREATE OR REPLACE FUNCTION public.give_plan_credits(user_uuid uuid, plan_name_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  config_row RECORD;
BEGIN
  -- Buscar configuração do plano
  SELECT * INTO config_row 
  FROM public.plan_credits_config 
  WHERE plan_name = plan_name_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar créditos de áudio
  IF config_row.initial_audio_credits > 0 THEN
    UPDATE public.user_audio_credits 
    SET credits = credits + config_row.initial_audio_credits, updated_at = now()
    WHERE user_id = user_uuid;
    
    -- Se não existir, criar
    IF NOT FOUND THEN
      INSERT INTO public.user_audio_credits (user_id, credits)
      VALUES (user_uuid, config_row.initial_audio_credits);
    END IF;
    
    -- Registrar transação
    INSERT INTO public.audio_credit_transactions (user_id, transaction_type, amount, description)
    VALUES (user_uuid, 'purchase', config_row.initial_audio_credits, 'Créditos do plano ' || plan_name_param);
  END IF;
  
  -- Atualizar créditos de voz
  IF config_row.initial_voice_credits > 0 THEN
    UPDATE public.user_voice_credits 
    SET credits = credits + config_row.initial_voice_credits, updated_at = now()
    WHERE user_id = user_uuid;
    
    -- Se não existir, criar
    IF NOT FOUND THEN
      INSERT INTO public.user_voice_credits (user_id, credits)
      VALUES (user_uuid, config_row.initial_voice_credits);
    END IF;
    
    -- Registrar transação
    INSERT INTO public.voice_credit_transactions (user_id, transaction_type, amount, description)
    VALUES (user_uuid, 'purchase', config_row.initial_voice_credits, 'Créditos de voz do plano ' || plan_name_param);
  END IF;
  
  RETURN TRUE;
END;
$function$;
