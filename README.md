# Modelle Única — Catálogo virtual

Next.js 15 + Supabase (Postgres, Auth, Storage). Vitrine pública + painel admin protegido por login.

## Acessar o painel admin

1. Abra `https://SEU-DOMINIO/admin`
2. Entre com o e-mail e senha cadastrados (Supabase Auth)
3. Primeiro acesso: crie o usuário no Supabase Dashboard → Authentication → Users → "Add user"

## Estrutura

- `src/app/(site)/` — vitrine pública (home, catálogo, produto, sobre, contato, favoritos, medidas)
- `src/app/admin/` — painel (dashboard, CRUD produtos, categorias/coleções, banners, cliques WhatsApp, configurações)
- `src/middleware.ts` — protege `/admin/*` (redireciona para login sem sessão válida)
- `supabase/migrations/` — schema, RLS, seed

## Desenvolvimento

```bash
npm install
npm run dev
```

Env vars necessárias (`.env.local` ou Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://bypxikshofvbnmbsatod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```

## Preços

Os 9 produtos do seed têm **preços de exemplo** — ajuste pelo painel em Produtos → Editar.
