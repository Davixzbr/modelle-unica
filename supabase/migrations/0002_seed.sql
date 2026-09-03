-- ============================================================
-- SEED — dados reais da Modelle Única (peças fotografadas)
-- Preços de exemplo — admin ajusta pelo painel
-- ============================================================

insert into public.categories (id, name, slug, sort_order) values
  ('c0000000-0000-0000-0000-000000000001', 'Conjuntos', 'conjuntos', 1),
  ('c0000000-0000-0000-0000-000000000002', 'Camisetas e Regatas', 'camisetas-regatas', 2),
  ('c0000000-0000-0000-0000-000000000003', 'Shorts', 'shorts', 3)
on conflict (slug) do nothing;

insert into public.collections (id, name, slug, description, active) values
  ('d0000000-0000-0000-0000-000000000001', 'Coleção Movimento', 'colecao-movimento',
   'Peças pensadas para acompanhar o corpo do treino ao resto do dia.', true)
on conflict (slug) do nothing;

insert into public.products
  (id, name, slug, description, fabric, size_chart, category_id, collection_id,
   price, promo_price, sizes, colors, images, tags, featured, status, sort_order)
values
  ('a0000000-0000-0000-0000-000000000001','Conjunto Marrom','conjunto-marrom',
   'Top e legging em malha de treino no marrom da estação, com caimento que acompanha o movimento.',
   'Malha de treino com elasticidade','',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
   189.90,null,'{P,M,G,GG}','{Marrom}','{"/images/look-007.jpg"}','{novo,exclusivo}',true,'active',1),

  ('a0000000-0000-0000-0000-000000000002','Conjunto Rosa','conjunto-rosa',
   'Top cropped creme com acabamento rosa e legging de cintura alta em rosa vibrante.',
   'Malha de treino com elasticidade','',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
   169.90,null,'{P,M,G,GG}','{Rosa,Creme}','{"/images/look-001.jpg"}','{novo}',false,'active',2),

  ('a0000000-0000-0000-0000-000000000003','Conjunto Azul-Marinho','conjunto-azul-marinho',
   'Top cropped de manga curta e calça wide-leg de cintura alta — do treino direto para o resto do dia.',
   'Tecido técnico','',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
   179.90,null,'{P,M,G,GG}','{Azul-marinho}','{"/images/look-002.jpg"}','{novo}',false,'active',3),

  ('a0000000-0000-0000-0000-000000000004','Conjunto Azul-Céu','conjunto-azul-ceu',
   'Top com capuz em tecido telado, zíper e legging de cintura alta na mesma cor.',
   'Tecido telado','',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
   179.90,null,'{P,M,G,GG}','{Azul-céu}','{"/images/look-006.jpg"}','{}',false,'active',4),

  ('a0000000-0000-0000-0000-000000000005','Conjunto Branco','conjunto-branco',
   'Top de alças finas com calça flare de cintura alta, em branco total, com recorte editorial.',
   'Malha de treino com elasticidade','',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
   189.90,null,'{P,M,G,GG}','{Branco}','{"/images/look-004.jpg"}','{exclusivo}',false,'active',5),

  ('a0000000-0000-0000-0000-000000000006','Conjunto Preto','conjunto-preto',
   'Top de manga longa com logo e legging em preto — o clássico que nunca falha no armário.',
   'Malha de treino com elasticidade','',
   'c0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001',
   169.90,null,'{P,M,G,GG}','{Preto}','{"/images/look-010.jpg"}','{}',true,'active',6),

  ('a0000000-0000-0000-0000-000000000007','Kit 3 Regatas','kit-3-regatas',
   'Três regatas de alças largas — vinho, branca e verde-oliva — com recorte nas costas.',
   'Malha leve','',
   'c0000000-0000-0000-0000-000000000002',null,
   99.90,null,'{P,M,G,GG}','{Vinho,Branco,Verde-oliva}','{"/images/look-008.jpg"}','{promocao}',false,'active',7),

  ('a0000000-0000-0000-0000-000000000008','Camiseta Dry-Fit','camiseta-dry-fit',
   'Camiseta de tecido perfurado que deixa o corpo respirar, em cores vivas.',
   'Tecido perfurado dry-fit','',
   'c0000000-0000-0000-0000-000000000002',null,
   69.90,null,'{P,M,G,GG}','{Verde,Azul-marinho,Vermelho}','{"/images/look-009.jpg"}','{}',false,'active',8),

  ('a0000000-0000-0000-0000-000000000009','Short Marrom-Taupe','short-marrom-taupe',
   'Short de cintura alta com cós franzido, bolsos laterais e forro interno.',
   'Malha com elasticidade','',
   'c0000000-0000-0000-0000-000000000003',null,
   89.90,null,'{P,M,G,GG}','{Marrom-taupe}','{"/images/look-005.jpg"}','{novo}',false,'active',9)
on conflict (slug) do nothing;

-- ---------- VARIAÇÕES: 4 tamanhos × 1 cor por produto (estoque exemplo 5) ----------
insert into public.variants (product_id, size, color, stock)
select p.id, s.sz, (select (array_remove(p.colors, null))[1]), 5
from public.products p
cross join (values ('P'),('M'),('G'),('GG')) as s(sz)
where p.id like 'a0000000-%'
on conflict do nothing;

-- Para produtos com múltiplas cores, gera variantes por cor também
insert into public.variants (product_id, size, color, stock)
select p.id, s.sz, c.col, 5
from public.products p
cross join (values ('P'),('M'),('G'),('GG')) as s(sz)
cross join unnest(p.colors) as c(col)
where p.id like 'a0000000-%' and array_length(p.colors, 1) > 1
on conflict do nothing;

-- ---------- BANNERS ----------
insert into public.banners (id, title, subtitle, image_url, link_url, sort_order, active) values
  ('b0000000-0000-0000-0000-000000000001',
   'Esteja sempre em movimento',
   'Coleção Movimento — peças que acompanham o corpo do treino ao resto do dia.',
   '/images/look-007.jpg', '/catalogo', 1, true),
  ('b0000000-0000-0000-0000-000000000002',
   'Novidades da estação',
   'Conheça os conjuntos e peças que acabaram de chegar.',
   '/images/look-001.jpg', '/catalogo?tag=novo', 2, true)
on conflict (id) do nothing;

-- ---------- SETTINGS ----------
insert into public.settings (key, value) values
  ('site', '{"name":"Modelle Única","tagline":"Esteja sempre em movimento.","whatsapp":"5563992678729","whatsappDisplay":"+55 63 99267-8729","instagram":"https://www.instagram.com/modelle_unica/","instagramHandle":"@modelle_unica","address":"","email":""}')
on conflict (key) do nothing;

insert into public.settings (key, value) values
  ('about', '{"title":"Sobre a Modelle Única","text":"A Modelle Única nasceu do desejo de vestir mulheres que não param: peças selecionadas uma a uma, com caimento, qualidade e atitude. Moda fitness, lingerie e biquínis com curadoria autêntica — porque cada corpo é único e merece peça à altura."}')
on conflict (key) do nothing;

insert into public.settings (key, value) values
  ('exchange_policy', '{"title":"Política de Trocas e Guia de Medidas","text":"Trocas em até 7 dias após o recebimento, com peça sem uso e etiqueta intacta. Para acertar o tamanho, chame no WhatsApp: indicamos o modelo ideal pra você."}')
on conflict (key) do nothing;
