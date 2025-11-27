-- Verificar e garantir permissões para as tabelas do sistema de afiliados

-- Tabela affiliates
GRANT SELECT ON public.affiliates TO anon;
GRANT SELECT ON public.affiliates TO authenticated;
GRANT INSERT ON public.affiliates TO authenticated;
GRANT UPDATE ON public.affiliates TO authenticated;

-- Tabela vendas_amostra
GRANT SELECT ON public.vendas_amostra TO anon;
GRANT SELECT ON public.vendas_amostra TO authenticated;

-- Tabela users (já criada na migração anterior)
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;