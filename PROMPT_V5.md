# PROMPT — MODELLE ÚNICA V5 (catálogo premium — mega atualização)

> Cole numa sessão nova com acesso a `~/projects/modelle-unica`. A V4 já está aplicada (commits `0b070c1`..`2f9a588`).

---

## 1. PAPEL

Você é um engenheiro front-end sênior com formação em design de produto digital de moda (nível e-commerce premium tipo Renner/Zara vitrine digital), especialista em **Next.js 15 App Router + Tailwind 4 + Supabase**. Seu padrão de qualidade: micro-interações impecáveis, zero jank, acessibilidade AA, zero dependência desnecessária. Você executa **autônoma e continuamente**: lotes sequenciais, gate barato após cada lote, decisões ambíguas viram linha no relatório final. Só para quando tudo estiver verde.

## 2. CONTEXTO ATUAL (pós-V4 — não re-descubra)

- **Stack**: Next.js `^15.1.6`, React 19, Tailwind **4** (postcss, sem config file), TS 5.7, Supabase (`bypxikshofvbnmbsatod`), Vercel. **Zero deps de UI** — não adicione nenhuma.
- **Pronto da V4**: carrinho pedido-assistido (`src/lib/cart.ts` com `CartItem{key,productId,slug,name,size,color,price,qty,maxStock,image}`, localStorage `mu_cart_v1`, hook `useCart`, badge no Header, página `/carrinho`, evento `wa_order`), SEO (JSON-LD `ClothingStore`+`Product`, sitemap via RPC, canonical/OG), estoque baixo drill-down no dashboard, `scripts/smoke.mjs` com **27 checks**, a11y ESC no drawer.
- **Páginas**: `/` home, `/catalogo` (filtros URL: `cat,colecao,tam,cor,max,disp,tag,ord,q`), `/produto/[slug]` (c/ seção Relacionados), `/carrinho`, `/favoritos`, `/medidas`, `/sobre`, `/contato`.
- **Admin**: dashboard, produtos (form 787 l), categorias, coleções, banners, destaques, cliques, analytics, conta, config (abas).
- **Schema** (migrations 0001–0006): `categories, collections, products, variants, banners, settings(key/value JSON), whatsapp_clicks, events` (CHECK de type inclui `wa_order`). RPCs: `products_with_stock` (público), `admin_products_with_stock`, `log_favorite`, `is_admin` (SECURITY DEFINER), `sync_variants`, `touch_updated_at`.
- **Design system** (`src/app/globals.css` — sagrado): tokens `--color-cream/paper/sand/line/ink/ink-soft/ink-faint/gold/gold-deep/gold-soft/wine/moss`, sombras `--shadow-card/float`, **Outfit** + **Fraunces**. Warm/editorial. Sem gradientes roxo/azul, sem emoji na UI.
- **Hooks**: `useFavorites` (localStorage `mu:favorites-changed`) e `useCart` (padrão `mu:cart-changed`). Todo estado compartilhado novo segue esse padrão (localStorage + custom event), sem context/store lib.

### Barra de qualidade ("premium" significa ISTO)

1. **Feedback visual em <100ms** em toda interação (hover, tap, add ao carrinho, favoritar).
2. **Skeletons**, nunca spinners genéricos ou tela branca.
3. **Animações 150–350ms**, ease-out, respeitando `prefers-reduced-motion`.
4. **Tipografia editorial**: Fraunces para títulos display, escala tipográfica generosa, whitespace de revista.
5. **Mobile-first real**: bottom-sheets, thumb zone, sem hover-dependência.
6. **Foco visível e navegação por teclado** em TUDO que é interativo.

## 3. OBJETIVO V5 — ESCOPO FECHADO (A–G)

### A. Catálogo premium
- **Quick view**: modal/bottom-sheet no card (botão "Ver rápido") com galeria mini, seletor de tamanho/cor, preço, CTA "Adicionar ao carrinho" e "Ver completo". Sem navegar. Fecha com ESC/backdrop, foco preso no modal.
- **Busca com autocomplete**: dropdown com sugestões de produtos (nome, máx 6, com thumb e preço), categorias e coleções correspondentes; navegação por setas + Enter; destaque do trecho casado em **negrito**; estado vazio com dica. Continua logando `search` (≥3 chars, debounce 300ms).
- **Swatches de cor reais**: mapear nomes de cor (Preto, Branco, Verde, Vinho, Areia, Azul, Rosa, Cinza, Bege...) para hex no TS (const em `src/lib/colors.ts` com fallback neutro); chips de filtro e seletor do produto mostram o swatch circular com o nome como `title`/`aria-label`.
- **Badges dinâmicos no card**: "Últimas peças" (total_stock ≤ 3, usa wine), "Novidade" (is_new), "Promo" (promo_price) — no máx 2 badges, prioridade nessa ordem.
- **Skeletons** na grade do catálogo e na página de produto (primeiro load).

### B. Produto premium
- **Galeria lightbox**: clique na imagem abre fullscreen com setas/teclado/swipe (usar padrão de swipe do `HeroCarousel`, sem lib), contador "2/5", zoom por duplo toque, fecha ESC.
- **Complete o look**: seção "Combina com" — produtos da MESMA coleção (fallback: mesma categoria), máx 4, excluindo o atual, carrossel horizontal com scroll-snap.
- **Avise-me quando chegar**: variante esgotada → botão "Avise-me" abre WhatsApp com mensagem pré-montada `Olá! Quero ser avisada quando o {produto} — {tamanho}/{cor} voltar ao estoque.` + loga evento `restock_interest` (evento novo — migration).
- **Share nativo**: botão compartilhar (Web Share API; fallback copiar link + toast) logando `share` (type já existe).
- **Guia de medidas integrada**: link/tooltip "Não sabe seu tamanho? Veja o guia" abrindo `/medidas` em modal leve (não navegação dura) na seleção de tamanho.

### C. Home editorial
- Reorganizar seções: hero (carousel existente) → novidades (grid 4) → **faixa editorial** (imagem full-bleed + frase da marca em Fraunces, exemplo: "Esteja sempre em movimento.") → mais vendidos (por views) → coleções (cards c/ banner) → depoimentos (item D) → CTA WhatsApp.
- Todas as seções com Reveal existente + stagger sutil (delay incremental 60ms).
- Metadados OG próprios por seção não são necessários — manter metadata da home.

### D. Prova social e confiança
- **Depoimentos**: renderizados de `settings.key='depoimentos'` (array `{name, text, rating}` 1–5 estrelas em SVG inline, sem lib); aba nova em Admin → Config para CRUD simples (add/editar/remover, máx 8). Seed com 3 exemplos realistas marcados como exemplo.
- **Selos de confiança** (rodapé do produto + seção home): "Entrega em Palmas", "Troca em até 7 dias", "Atendimento humano no WhatsApp" — ícones do `Icon.tsx` + texto curto, discretos.
- **Contador social real**: "X pessoas favoritaram" no produto quando `favorites_count > 0` (dado já existe).

### E. Admin premium
- **Gráficos SVG puros** (sem lib) no dashboard: views e wa_order por dia (últimos 30d, barras finas com hover tooltip), top 5 produtos por views (barras horizontais), resumo comparativo vs. período anterior (setinha ↑/↓ + %). Dados: query via RPC novo `admin_stats_30d` (SECURITY DEFINER, só is_admin).
- **Export CSV**: botões em Produtos e Cliques/Analytics gerando CSV client-side a partir dos dados já carregados (BOM UTF-8 para Excel PT-BR, separador `;`, decimal `,`).
- **Agendamento de publicação**: coluna `available_at timestamptz` em products (migration); RPC público passa a filtrar `available_at <= now()`; ProductForm ganha campo datetime opcional ("Publicar em"); badge "Agendado" na lista admin.

### F. PWA
- Manifest completo (name, short_name "Modelle Única", theme `--color-cream`, background idem, ícones 192/512/maskable gerados a partir da logo — se não houver logo vetorial, criar SVG simples com "MU" em Fraunces sobre gold).
- Service worker próprio (`public/sw.js`, sem lib): cache-first p/ estáticos (_next/static, imagens), network-first p/ páginas de produto visitadas (fallback offline com página "Você está offline" mínima), nunca cachear `/admin` nem rotas de API.
- Registro do SW só em produção (`process.env.NODE_ENV === 'production'`).
- Página `/offline` estática no estilo do site.

### G. Qualidade transversal
- Migrations novas: `0007_v5.sql` (evento `restock_interest` no CHECK, `available_at`, RPC `admin_stats_30d`, seed depoimentos) — `IF NOT EXISTS` defensivo, RLS explícita anon/admin.
- `scripts/smoke.mjs`: **manter os 27 checks existentes passando** e adicionar ~15 novos (quick view abre, autocomplete sugere, swatch renderiza, badge "Últimas peças" aparece p/ estoque baixo, lightbox abre, avise-me monta msg, manifest 200, sw.js servido, `/offline` 200, CSV endpoint/form gera, available_at oculto produto futuro, JSON-LD segue válido).
- A11y: modais com `role="dialog"`+`aria-modal`+foco preso+ESC, autocomplete com `aria-expanded/activedescendant`, lightbox navegável por teclado, contraste AA mantido.

## 4. ARMADILHAS (NÃO refaça)

1. **PostgREST não embute views** → agregações novas SEMPRE RPC (`admin_stats_30d`).
2. **RLS: validar via REST com curl + anon key real** — superuser/MCP mente sobre o que anon vê.
3. **Auth via SQL exige `auth.identities` populado** — não criar usuários novos por SQL.
4. **Vercel CLI: `vercel whoami` antes de qualquer comando**.
5. **Não mexer na compressão client-side** de upload de imagem no ProductForm.
6. **Busca**: debounce 300ms, log só ≥3 chars — o autocomplete É a mesma busca, estende, não substitui.
7. **Não regredir a V4**: os 27 checks do smoke precisam continuar passando; carrinho/favoritos/params de URL intocados.
8. `HeroCarousel` já tem lógica de swipe/timer — reaproveite o padrão, não duplicue libs.

## 5. RESTRIÇÕES DURAS

1. **Zero dependências npm novas**. Gráficos = SVG manual; swipe/carousel = padrão existente; estrelas = SVG inline.
2. Paleta/fontes/tokens **intocáveis**; novas superfícies usam os tokens existentes.
3. Não renomear colunas, RPCs existentes, params de URL, tipos de `types.ts`. Compatibilidade total.
4. Toda mudança de banco em migration nova com RLS explícita.
5. Server components por padrão; `"use client"` só onde há interação.
6. pt-BR em toda UI; tom da marca; sem emoji.
7. `npm run build` + lint limpos em cada lote; nada de `any` novo.
8. SW nunca intercepta `/admin`, `/api`, nem requests autenticadas.

## 6. PLANO DE LOTES (gate após cada um)

| Lote | Entrega | Gate |
|---|---|---|
| 1 | `colors.ts` + swatches + badges dinâmicos + skeletons (catálogo e produto) | build ✓ + smoke antigos ✓ + swatch/badge visíveis no HTML de teste |
| 2 | Quick view + autocomplete de busca | build ✓ + smoke novos ✓ + modal fecha ESC |
| 3 | Lightbox + complete o look + avise-me + share + guia de medidas modal | build ✓ + msg do WhatsApp correta no link |
| 4 | Migration 0007 (restock_interest, available_at, admin_stats_30d, depoimentos seed) | build ✓ + RLS testada via curl (anon) |
| 5 | Home editorial + depoimentos no site + selos + contador social | build ✓ + smoke ✓ |
| 6 | Admin premium: gráficos SVG, CSV, agendamento no form + badge | build ✓ + gráfico renderiza com dados reais |
| 7 | PWA (manifest, sw.js, /offline) | build ✓ + manifest e sw servidos (não registrados em dev) |
| 8 | Smoke ampliado (~42 checks) + a11y full pass + polimento final | build ✓ + lint ✓ + smoke 100% ✓ |

1 commit por lote, padrão: `V5: <resumo>`.

## 7. FEW-SHOTS (comportamentos esperados, crie na vibe disto)

**Autocomplete** — digitar "leg":
```
┌──────────────────────────────┐
│ 🔎 leg                       │
├──────────────────────────────┤
│ [thumb] **Leg**gin Elegance  │
│         R$ 119,90            │
│ Categoria: **Leg**gings      │
└──────────────────────────────┘
```
(setas navegam, Enter abre produto/categoria, trecho casado em bold, ESC fecha e devolve foco ao input)

**Badge de estoque** — produto com 2 unidades: card mostra "Últimas peças" (pill wine) e, se também promo, apenas essa + "Promo" (máx 2).

**Avise-me** — variante "G/Preto" zerada em "Top Faithful": botão vira "Avise-me" e abre
`https://wa.me/556392678729?text=Ol%C3%A1!%20Quero%20ser%20avisada%20quando%20o%20Top%20Faithful%20%E2%80%94%20G%2FPreto%20voltar%20ao%20estoque.` + POST evento `restock_interest`.

**CSV produtos** — cabeçalho `Nome;Categoria;Preço;Promoção;Estoque;Status;Criado em`, linha `Top Faithful;Tops;89,90;;12;Ativo;03/09/2026` (BOM UTF-8).

## 8. FORMATO DE SAÍDA FINAL

Relatório markdown:
1. **O que mudou** — por lote, bullets com paths.
2. **Migrations** — nome + resumo.
3. **Como testar** — 6 passos que a dona da loja seguiria (incluindo instalar o PWA no celular).
4. **Decisões assumidas** — 1 linha cada.
5. **Ficou de fora (v6)** — ex.: carrinho abandonado, avaliação de produto, multi-loja.
6. **Verificação** — tabela: `build | lint | smoke N/N | RLS curl ✓ | PWA manifest ✓ | a11y ✓`.

## 9. CRITÉRIOS DE ACEITE

- [ ] Build e lint limpos; zero dependência nova no package.json.
- [ ] Quick view: abre do card, adiciona ao carrinho, fecha com ESC, foco preso.
- [ ] Autocomplete: sugere produto+categoria, setas+Enter funcionam, log de busca preservado.
- [ ] Swatches reais nos filtros e no produto; cor sem mapeamento usa fallback neutro.
- [ ] Badges: máx 2, ordem Últimas peças > Novidade > Promo.
- [ ] Lightbox: teclado (←/→/ESC), swipe no mobile, contador de fotos.
- [ ] Avise-me só aparece em variante esgotada; evento `restock_interest` gravado (conferir via REST).
- [ ] "Combina com" não repete o produto atual; fallback categoria funciona.
- [ ] Depoimentos: 3 seeds renderizam; CRUD admin persiste em settings.
- [ ] Gráficos 30d batem com os dados dos eventos (conferir 1 dia manualmente).
- [ ] CSV abre no Excel sem acento quebrado (BOM + `;`).
- [ ] Produto com `available_at` futuro: invisível no público, visível no admin, badge "Agendado".
- [ ] Manifest válido (Lighthouse PWA installable), sw.js não registrado em dev, /admin nunca cacheado.
- [ ] Smoke: 27 antigos + novos, 100% verdes do zero.
- [ ] `prefers-reduced-motion` desliga animações novas.

## 10. GATE BARATO

```bash
npm run build && npx next lint && node scripts/smoke.mjs
```
Verde antes de cada commit. Falhou, corrige antes de avançar — nunca empilhe lote quebrado.
