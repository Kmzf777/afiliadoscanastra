# Afiliados Café Canastra

Site de afiliados para o Café Canastra construído com Next.js, TypeScript, Tailwind CSS e Supabase.

## Funcionalidades

- ✅ **Home**: Input de código de 6 dígitos com validação em tempo real
- ✅ **Ranking**: Exibição dos códigos com mais vendas pagas
- ✅ **Ativação**: Página `/ativar` com validação de CPF e criação de senha
- ✅ **Dashboard**: Área protegida para afiliados autenticados
- ✅ **Autenticação**: Sistema completo com Supabase Auth
- ✅ **APIs**: Endpoints para validação de código, ranking e ativação
- ✅ **Design Responsivo**: Mobile-first com Tailwind CSS
- ✅ **Acessibilidade**: Conformidade AA com foco visível e labels explícitos

## Tecnologias

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Ícones**: Lucide React
- **Fonte**: Inter (Google Fonts)

## Instalação

1. **Clone o repositório**
   ```bash
   git clone [url-do-repositorio]
   cd afiliados-cafe-canastra
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Copie `.env.local.example` para `.env.local` e configure:
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # APIs
│   │   ├── codes/validate/ # Validação de códigos
│   │   ├── affiliates/
│   │   │   ├── ranking/    # Ranking de vendas
│   │   │   └── activate/   # Ativação de afiliados
│   ├── ativar/            # Página de ativação
│   ├── dashboard/         # Dashboard protegido
│   ├── login/             # Página de login
│   └── page.tsx           # Home
├── components/            # Componentes React
│   ├── CodeInput.tsx      # Input de 6 dígitos
│   ├── RankingItem.tsx    # Item do ranking
│   └── AuthProvider.tsx   # Provider de autenticação
├── lib/                   # Utilitários
│   ├── supabase.ts        # Cliente Supabase
│   └── supabase-server.ts # Cliente server-side
└── middleware.ts          # Proteção de rotas
```

## Fluxo de Funcionamento

### 1. Validação de Código
- Usuário digita 6 dígitos na home
- Sistema valida via API `/api/codes/validate`
- Se código estiver inativo → redireciona para `/ativar`

### 2. Ativação de Afiliado
- Usuário informa CPF e cria senha
- Sistema verifica se CFG comprou com aquele código
- Cria conta no Supabase Auth e ativa afiliado
- Redireciona para dashboard

### 3. Dashboard
- Área protegida para afiliados autenticados
- Exibe estatísticas e código do afiliado
- Logout funcional

## Segurança

- Service Role Key nunca exposta no client
- Sanitização de inputs no server-side
- Rate limiting implementado
- Mensagens genéricas para evitar enumeração
- RLS (Row Level Security) no Supabase

## Personalização

### Cores
Edite `tailwind.config.js` para alterar a paleta de cores (primária: amber).

### Tipografia
A fonte Inter é carregada via Google Fonts em `globals.css`.

### Componentes
Os componentes seguem o padrão de design system com:
- Cards com `bg-white border border-gray-200 rounded-xl shadow-lg`
- Botões CTA com `bg-amber-600 hover:bg-amber-700`
- Inputs com `border-2 border-gray-200 rounded-xl focus:border-amber-500`

## Deploy

### Vercel (Recomendado)
1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outros provedores
Certifique-se de configurar as variáveis de ambiente corretamente.

## Suporte

Para dúvidas sobre o código ou funcionalidades, consulte a documentação do Next.js e Supabase.

---

Desenvolvido com ❤️ para Café Canastra