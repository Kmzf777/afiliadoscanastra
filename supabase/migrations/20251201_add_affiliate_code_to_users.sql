-- Adicionar coluna affiliate_code na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

-- Criar índice para o novo campo
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON public.users(affiliate_code);
