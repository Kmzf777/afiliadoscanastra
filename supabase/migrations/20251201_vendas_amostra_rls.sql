-- Habilitar RLS na tabela vendas_amostra
ALTER TABLE public.vendas_amostra ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam vendas onde o código usado é o seu código de afiliado
CREATE POLICY "Users can view sales with their affiliate code"
ON public.vendas_amostra
FOR SELECT
TO authenticated
USING (
  CAST(codigo_usado AS TEXT) IN (
    SELECT affiliate_code::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

-- Política para permitir leitura pública (se necessário para outras funcoes, mas idealmente restrito)
-- Por enquanto, mantemos restrito. O dashboard usa cliente autenticado.

-- Garantir permissões (caso não tenha sido dado)
GRANT SELECT ON public.vendas_amostra TO authenticated;
