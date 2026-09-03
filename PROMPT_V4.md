# PROMPT — MODELLE ÚNICA V4 (execução completa)

> Copie tudo abaixo e cole numa sessão nova com acesso a `~/projects/modelle-unica`.

---

## 1. PAPEL

Você é um engenheiro full-stack sênior especializado em **Next.js 15 (App Router) + Supabase**, com olho de produto para e-commerce de moda feminina de bairro (Modelle Única, Palmas-TO, vendas via WhatsApp). Você executa de forma **autônoma e contínua**: implementa em lotes, valida cada lote com o gate barato (§8), e só para no fim. Não faz perguntas de confirmação no meio — decisões ambíguas viram uma linha no relatório final ("decisões assumidas").

## 2. CONTEXTO DO PROJETO (não re-descubra, use isto)

- **Local**: `~/projects/modelle-unica`. Git limpo (só `supabase/.temp/` não versionado).
- **Stack real**: Next.js `^15.1.6`, React 19, Tailwind CSS **4** (via `@tailwindcss/postcss`, sem `tailwind.config`), TypeScript 5.7, `@supabase/ssr` + `@supabase/supabase-js` 2. Deploy: Vercel (`modelle-unica.vercel.app`). Projeto Supabase: `bypxikshofvbnmbsatod`.
- **Páginas públicas** (`src/app/(site)/`): home, `/catalogo` (client c/ filtros por URL: `cat, colecao, tam, cor, max, disp, tag, ord, q` — manter compatibilidade total desses params), `/produto/[slug]`, `/favoritos`, `/medidas`, `/sobre`, `/contato`.
- **Admin** (`src/app/admin/`, protegido por `src/middleware.ts`): dashboard, produtos (form 787 linhas c/ unsaved guard), categorias, coleções, banners, destaques, cliques, analytics, conta, config.
- **Schema** (migrations 0001–0005): `categories, collections, products, variants, banners, settings (key/value JSON), whatsapp_clicks` + eventos. RPCs existentes que você **deve reusar, nunca quebrar**: `products_with_stock` (público), `admin_products_with_stock`, `log_favorite`, `is_admin` (SECURITY DEFINER), `sync_variants`, `touch_updated_at`.
- **Design system** (em `src/app/globals.css` — NÃO trocar a paleta): tokens `--color-cream/paper/sand/line/ink/ink-soft/ink-faint/gold/gold-deep/gold-soft/wine/moss`, sombras `--shadow-card/--shadow-float`, fontes **Outfit** (sans) + **Fraunces** (serif). Estilo anti-IA: warm, editorial, sem gradientes roxo/azul genéricos, sem emoji na UI.
- **Dados**: 9 produtos seed com preços de exemplo. Config do site em `settings.key='site'` (WhatsApp `+55 63 9267-8729`, Instagram `@modelle_unica`, `low_stock: 2`).
- **Favoritos**: localStorage (`src/lib/format.ts` readFavorites/writeFavorites) + evento `mu:favorites-changed` + RPC `log_favorite` c/ contador no banco.

### Armadilhas já mapeadas (NÃO refaça esses erros)

1. **PostgREST não embute views** → qualquer agregação de estoque nova DEVE ser RPC, não view.
2. **RLS: testar sempre via REST** com a anon key real (curl no endpoint `/rest/v1/`), nunca só no SQL editor — o MCP/superuser mente sobre o que o anon vê.
3. **Auth: usuário criado via SQL só existe de verdade com `auth.identities` populado** — se criar admin, usar o flow correto (Dashboard ou `auth.users` + identities).
4. **Vercel CLI: rodar `vercel whoami` antes de qualquer comando** de deploy/inspect.
5. Upload de imagem usa **compressão client-side** existente — não remover.
6. Busca loga evento `search` só com termo ≥ 3 chars, debounce 300ms — preservar.

## 3. OBJETIVO DA V4 (escopo fechado — nada fora desta lista sem registrar como "extra")

Transformar o catálogo em **loja de pedido-assistido completa**, nesta ordem de valor:

### A. Carrinho + Pedido via WhatsApp
- Carrinho client-side (padrão favoritos: localStorage + evento custom `mu:cart-changed` + hook `useCart` em `src/hooks/`), com variante (size+color via `variants`), quantidade limitada ao estoque real da variante.
- Página `/carrinho`: editar qtd, remover, subtotal, resumo. **Sem checkout online** — botão "Finalizar no WhatsApp" monta mensagem estruturada:
  ```
  Olá! Quero fazer um pedido:
  • Top Faithful — G / Preto — 2x R$ 89,90
  • Leggin Elegance — M / Verde — 1x R$ 119,90
  Total: R$ 299,70
  (pode alterar valores/retirar no local?)
  ```
- Badge de contagem no Header (como o `FavoritesCounter`).
- Log de evento novo `type: 'wa_order'` em `shop_events` (migration: ajustar o CHECK de type se existir).

### B. SEO técnico real
- JSON-LD em `/produto/[slug]`: `Product` com `offers` (preço, promo_price como `priceValidUntil` não — só price atual), `availability` mapeada de `total_stock`, `brand`.
- JSON-LD `Organization` no layout do site com logo/perfil Instagram.
- `generateMetadata` completo em catálogo (título dinâmico c/ filtro), sitemap dinâmico lendo produtos ativos do banco, `canonical` nas páginas principais.
- OG image por produto usando `main_image`.

### C. Performance
- Migrar todas as `<img>` do site público para `next/image` (remotePatterns p/ o host do Supabase Storage em `next.config.ts`). ProductCard e HeroCarousel com `sizes` corretos e `priority` só no primeiro item/primeiro slide.
- `next/font` já usado — garantir `display: swap` e preload só das duas fontes.

### D. Alerta de estoque no admin
- Dashboard: card "Estoque baixo" (produtos com `total_stock <= settings.low_stock`) já existe o conceito — garantir que variantes zeradas aparecem com drill-down (tabela produto → variantes `stock = 0`).

### E. Qualidade transversal
- Testes de fumaça: script `scripts/smoke.mjs` que roda contra o dev server e valida: home 200, catálogo 200 c/ cada param de filtro, produto válido 200, produto inválido 404, /admin redireciona p/ login sem sessão, RPC `products_with_stock` retorna array via REST.
- Acessibilidade: `aria-label` nos botões-ícone (favoritar, WhatsApp, fechar drawer), foco visível nos inputs, drawer de filtros com `role="dialog"` + ESC fecha.
- Página `/medidas` e drawer: garantir contraste AA com os tokens existentes.

## 4. RESTRIÇÕES DURAS

1. **Não alterar** a paleta, fontes, ou o estilo visual existente — a v4 é funcional, não re-design.
2. **Não renomear** colunas, RPCs, tipos de `src/lib/types.ts` nem os params de URL do catálogo (compatibilidade retroativa obrigatória).
3. Toda mudança de banco em **nova migration** (`0006_v4.sql` em diante), com `-- IF NOT EXISTS` defensivo, e RLS escrita para **anon e admin** explícitos.
4. Client components só onde há interação real; tudo o mais server component.
5. Sem novas dependências npm sem justificativa escrita no relatório (ideal: zero).
6. `npm run build` deve passar com **zero erro** e lint limpo ao final de cada lote.
7. Mensagens/labels da UI em pt-BR, tom da marca ("Esteja sempre em movimento.").
8. Nunca commitar `.env*` nem expor service_role no client.

## 5. PLANO DE EXECUÇÃO (lotes — implemente e valide um antes do próximo)

| Lote | Entrega | Gate |
|---|---|---|
| 1 | Migration 0006 (type `wa_order` + o que A precisa) + hook `useCart` + contexto carrinho + Header badge | build ✓ + smoke: carrinho persiste no localStorage |
| 2 | Página `/carrinho` + mensagem WhatsApp estruturada + evento `wa_order` no banco | build ✓ + conferir msg gerada no wa.me link de teste |
| 3 | JSON-LD produto + organização + metadata catálogo + sitemap dinâmico + OG | build ✓ + validar JSON-LD com parser (ex.: extrair `<script type="application/ld+json">` e `JSON.parse`) |
| 4 | `next/image` em ProductCard, HeroCarousel, ProductDetail, banners + remotePatterns | build ✓ + sem `<img>` restante no site público (`grep -r "<img" src/app/\(site\) src/components` vazio) |
| 5 | Estoque baixo drill-down no dashboard | build ✓ + query REST listando variantes zeradas |
| 6 | `scripts/smoke.mjs` completo + a11y pass (aria/ESC/dialog) | smoke 100% verde + build final |

Cada lote = 1 commit com mensagem descritiva no padrão do histórico (ex.: `V4: carrinho WhatsApp pedido-assistido (hook useCart, badge, página, wa_order)`).

## 6. FORMATO DE SAÍDA FINAL (obrigatório)

Termine com relatório em markdown contendo:

1. **O que mudou** — por lote, 1–3 bullets cada, com paths dos arquivos tocados.
2. **Migrations criadas** — nome + resumo das alterações de schema/RLS.
3. **Como testar** — 5 passos práticos que a dona da loja (não-dev) conseguiria seguir.
4. **Decisões assumidas** — toda ambiguidade resolvida sem perguntar, 1 linha cada.
5. **O que ficou de fora** — sugestões p/ v5 (ex.: cupons, pedido salvo, multi-admin).
6. **Status de verificação** — tabela: `build ✓/✗ | lint ✓/✗ | smoke N/N ✓ | JSON-LD válido ✓/✗ | REST RLS testado ✓/✗`.

## 7. CRITÉRIOS DE ACEITE (verifique item por item antes de declarar pronto)

- [ ] `npm run build` sem erro; `next lint` sem warning novo.
- [ ] Adicionar 2 produtos com variante ao carrinho → mensagem do WhatsApp contém produto, tamanho, cor, qtd, preço unitário e total corretos.
- [ ] Estoque esgotado de variante impede adicionar ao carrinho (botão desabilitado + label "Esgotado").
- [ ] URL antiga de catálogo com filtros (`?cat=x&ord=price_asc`) continua funcionando igual.
- [ ] Favoritos continuam funcionando (contador, RPC, evento custom).
- [ ] JSON-LD do produto passa em JSON.parse e contém price + availability.
- [ ] `grep -r '<img' src/app/'(site)' src/components` retorna vazio.
- [ ] RLS: anon NÃO lê rascunho (`status='draft'`) via REST; admin lê tudo — testado com curl real, não suposição.
- [ ] Smoke script verde do zero (dev server recém-subido).
- [ ] Nenhum arquivo fora de `src/`, `supabase/migrations/`, `scripts/`, `next.config.ts` modificado (exceto locks).

## 8. GATE BARATO (validador como test suite)

Antes de cada commit de lote, rode em sequência e só siga se tudo passar:
```bash
npm run build && npx next lint && node scripts/smoke.mjs
```
Se algo falhar, corrija antes de avançar — nunca empilhe lotes quebrados.
