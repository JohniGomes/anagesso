-- ============================================================
-- ERP ANAGESSO — Schema Supabase
-- Cole este SQL no Supabase → SQL Editor → Run
-- ============================================================

-- Clientes
create table if not exists clientes (
  id text primary key,
  nome text,
  telefone text,
  email text,
  "dataCadastro" text
);

-- Base de Itens
create table if not exists base_itens (
  id text primary key,
  produto text,
  preco numeric,
  unidade text
);

-- Obras
create table if not exists obras (
  id text primary key,
  nome text,
  "dtInicio" text,
  "dtEntrega" text,
  fase text,
  "valorOrcamento" numeric default 0,
  "valorFechado" numeric default 0,
  "valorPago" numeric default 0,
  "valorReceber" numeric default 0,
  variaveis numeric default 0,
  material numeric default 0,
  "maoDeObra" numeric default 0,
  "custoObra" numeric default 0,
  lucro numeric default 0,
  itens text,
  pagamentos text,
  "custosExtras" text
);

-- Mão de Obra
create table if not exists mao_de_obra (
  id text primary key,
  funcionario text,
  data text,
  dia text,
  servico text,
  valor numeric default 0,
  vale numeric default 0
);

-- Orçamentos
create table if not exists orcamentos (
  id text primary key,
  cliente text,
  telefone text,
  email text,
  data text,
  status text,
  obs text,
  itens text,
  "valorTotal" numeric default 0
);

-- Financeiro
create table if not exists financeiro (
  id text primary key,
  tipo text,
  cat text,
  sub text,
  tipod text,
  "desc" text,
  parceiro text,
  valor numeric default 0,
  status text,
  obs text,
  emissao text,
  venc text,
  pag text,
  parcela text
);

-- Veículos
create table if not exists veiculos (
  id text primary key,
  placa text,
  modelo text,
  motorista text,
  data text,
  horario text,
  tipo text,
  obs text
);

-- Cobranças
create table if not exists cobranca (
  id text primary key,
  cliente text,
  telefone text,
  "valorTotal" numeric default 0,
  parcelas text,
  "diaVenc" text,
  obs text,
  status text,
  "dataCadastro" text
);

-- Compras de Material
create table if not exists compras (
  id text primary key,
  "obraId" text,
  "obraNome" text,
  data text,
  operador text,
  itens text,
  "valorTotal" numeric default 0,
  "temNota" text,
  obs text,
  "dataCadastro" text
);

-- ── Desabilita RLS (app tem autenticação própria) ──────────────
alter table clientes    disable row level security;
alter table base_itens  disable row level security;
alter table obras       disable row level security;
alter table mao_de_obra disable row level security;
alter table orcamentos  disable row level security;
alter table financeiro  disable row level security;
alter table veiculos    disable row level security;
alter table cobranca    disable row level security;
alter table compras     disable row level security;
