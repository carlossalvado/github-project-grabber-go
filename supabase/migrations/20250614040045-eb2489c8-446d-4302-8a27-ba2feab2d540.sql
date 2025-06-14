
-- Criar tabela para controlar o trial dos usuários
CREATE TABLE public.user_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '72 hours'),
  trial_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Adicionar RLS para segurança
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios trials
CREATE POLICY "Users can view their own trials" 
  ON public.user_trials 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para inserir trials
CREATE POLICY "Users can create their own trials" 
  ON public.user_trials 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar trials
CREATE POLICY "Users can update their own trials" 
  ON public.user_trials 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Função para verificar se o trial ainda está ativo
CREATE OR REPLACE FUNCTION public.is_trial_active(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_trials 
    WHERE user_id = user_uuid 
    AND trial_active = true 
    AND trial_end > now()
  );
END;
$$;

-- Função para iniciar um trial
CREATE OR REPLACE FUNCTION public.start_trial(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_trials (user_id, trial_start, trial_end, trial_active)
  VALUES (user_uuid, now(), now() + interval '72 hours', true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    trial_start = now(),
    trial_end = now() + interval '72 hours',
    trial_active = true,
    updated_at = now();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;
