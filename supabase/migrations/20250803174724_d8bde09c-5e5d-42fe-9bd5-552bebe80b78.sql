-- Adiciona colunas necessárias para o ASAAS na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;