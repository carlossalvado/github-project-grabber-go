
-- Criar tabela para gerenciar créditos de áudio dos usuários
CREATE TABLE public.user_audio_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela para registrar transações de créditos
CREATE TABLE public.audio_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage')),
  amount INTEGER NOT NULL,
  description TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para produtos de créditos
CREATE TABLE public.audio_credit_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- preço em centavos
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir produto padrão de 100 créditos
INSERT INTO public.audio_credit_products (name, credits, price) 
VALUES ('100 Créditos de Áudio', 100, 999); -- $9.99

-- Habilitar RLS
ALTER TABLE public.user_audio_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_credit_products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_audio_credits
CREATE POLICY "Users can view their own credits" ON public.user_audio_credits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own credits" ON public.user_audio_credits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service can insert credits" ON public.user_audio_credits
  FOR INSERT WITH CHECK (true);

-- Políticas RLS para audio_credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.audio_credit_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can insert transactions" ON public.audio_credit_transactions
  FOR INSERT WITH CHECK (true);

-- Políticas RLS para audio_credit_products (todos podem ler)
CREATE POLICY "Anyone can view credit products" ON public.audio_credit_products
  FOR SELECT TO authenticated USING (true);

-- Função para inicializar créditos quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_audio_credits (user_id, credits)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.audio_credit_transactions (user_id, transaction_type, amount, description)
  VALUES (NEW.id, 'purchase', 10, 'Créditos iniciais grátis');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar créditos iniciais
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Função para consumir créditos
CREATE OR REPLACE FUNCTION public.consume_audio_credit(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Verificar créditos atuais
  SELECT credits INTO current_credits 
  FROM public.user_audio_credits 
  WHERE user_id = user_uuid;
  
  -- Se não tem créditos suficientes, retorna false
  IF current_credits IS NULL OR current_credits < 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Consumir 1 crédito
  UPDATE public.user_audio_credits 
  SET credits = credits - 1, updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Registrar transação
  INSERT INTO public.audio_credit_transactions (user_id, transaction_type, amount, description)
  VALUES (user_uuid, 'usage', -1, 'Mensagem de áudio enviada');
  
  RETURN TRUE;
END;
$$;

-- Função para adicionar créditos
CREATE OR REPLACE FUNCTION public.add_audio_credits(user_uuid UUID, credit_amount INTEGER, session_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Adicionar créditos
  UPDATE public.user_audio_credits 
  SET credits = credits + credit_amount, updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Se o usuário não existir, criar registro
  IF NOT FOUND THEN
    INSERT INTO public.user_audio_credits (user_id, credits)
    VALUES (user_uuid, credit_amount);
  END IF;
  
  -- Registrar transação
  INSERT INTO public.audio_credit_transactions (user_id, transaction_type, amount, description, stripe_session_id)
  VALUES (user_uuid, 'purchase', credit_amount, 'Compra de créditos de áudio', session_id);
  
  RETURN TRUE;
END;
$$;
