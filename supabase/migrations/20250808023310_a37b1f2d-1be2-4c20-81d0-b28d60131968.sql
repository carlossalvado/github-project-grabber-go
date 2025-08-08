-- Função para processar upgrade do plano Text & Audio com créditos
CREATE OR REPLACE FUNCTION public.upgrade_to_text_audio_with_subscription(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_credits integer;
  cost integer := 20;
  subscription_end_date timestamptz;
BEGIN
  -- 1. Pega o saldo de créditos do usuário de forma segura
  SELECT credits INTO current_credits FROM public.user_audio_credits WHERE user_id = p_user_id;

  -- 2. Se não tiver créditos suficientes, retorna 'false'
  IF current_credits IS NULL OR current_credits < cost THEN
    RETURN FALSE;
  END IF;

  -- 3. Se tiver créditos, debita o valor
  UPDATE public.user_audio_credits
  SET credits = credits - cost
  WHERE user_id = p_user_id;
  
  -- 4. Registra a transação para histórico
  INSERT INTO public.audio_credit_transactions (user_id, transaction_type, amount, description)
  VALUES (p_user_id, 'usage', -cost, 'Upgrade para o plano Text & Audio');

  -- 5. Atualiza o perfil do usuário para ativar o novo plano
  UPDATE public.profiles
  SET 
    plan_name = 'Text & Audio',
    plan_active = TRUE
  WHERE id = p_user_id;

  -- 6. Cria ou atualiza a subscription por 30 dias
  subscription_end_date := NOW() + INTERVAL '30 days';
  
  INSERT INTO public.subscriptions (user_id, plan_id, status, plan_name, start_date, end_date)
  VALUES (p_user_id, 2, 'active', 'Text & Audio', NOW(), subscription_end_date)
  ON CONFLICT (user_id, plan_name) 
  DO UPDATE SET 
    status = 'active',
    start_date = NOW(),
    end_date = subscription_end_date,
    updated_at = NOW();

  -- 7. Retorna 'true' para indicar sucesso
  RETURN TRUE;
END;
$function$;