## Conexões com Supabase
- Client: `src/lib/supabase.ts` usa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para login e sessão.
- Server: `src/lib/supabase-server.ts` usa `SUPABASE_SERVICE_ROLE_KEY` para `auth.admin.createUser` e leitura/atualização de tabelas.
- Tabelas: `affiliates`, `vendas_amostra` e `users` (migração em `supabase/migrations/20251126_create_users_table.sql` com RLS e políticas de leitura por CPF).
- Sessão: middleware verifica cookie `sb-access-token` e protege `'/dashboard'`.

## O que já está correto
- `POST /api/affiliates/activate`: valida código inativo (`affiliates`), confere CPF+code em `vendas_amostra`, cria usuário no Auth e ativa o afiliado (`route.ts:18-115`).
- `/ativar`: coleta CPF e senha, envia para o endpoint e hoje redireciona a `'/dashboard'` (`src/app/ativar/page.tsx`).
- Login por CPF: `/login` busca `email` na `users` e faz `supabase.auth.signInWithPassword`.

## Ajuste proposto (melhor UX, mantendo Supabase)
- Backend `route.ts`: retornar `{ success, email, userId }` no sucesso para permitir login automático no client.
- Frontend `/ativar`: após sucesso, realizar `supabase.auth.signInWithPassword({ email, password })` e então `router.push('/dashboard')`.
- Sem mudar backend, alternativa: buscar `email` na `users` com CPF e logar (mesma lógica da `/login`).
- Validação extra de CPF (11 dígitos) no client antes de enviar.

## Passos Técnicos
- `src/app/api/affiliates/activate/route.ts`: ajustar o `return` final para incluir `email` (derivado de `vendas_amostra`) e tratar caso de usuário já existente como sucesso.
- `src/app/ativar/page.tsx`: usar `email` retornado (ou buscar na `users`) e chamar `supabase.auth.signInWithPassword` antes do redirect.

## Verificação
- Usar `code=964421` e `cpf=11171077602`.
- Confirmar criação/associação em Auth e `users`, `affiliates.status='active'`, e sessão criada (cookie `sb-access-token`).

## Segurança
- Service Role fica somente no server.
- CPF sanitizado (`replace(/\D/g, '')`).
- Respostas genéricas para evitar enumeração.

Posso aplicar esses ajustes para conectar a ativação e o login ao Supabase de ponta a ponta?