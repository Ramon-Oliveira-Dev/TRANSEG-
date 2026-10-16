-- ══════════════════════════════════════════════════════════════════
-- TRANSEG TECNOLOGIAS DE SEGURANÇA — ESQUEMA COMPLETO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ══════════════════════════════════════════════════════════════════

-- 1. Criação das Tabelas Principais

-- Tabela de Usuários / Contas de Acesso
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('cliente', 'profissional', 'admin')),
  is_email_verified BOOLEAN DEFAULT true,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Clientes Cadastrados
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Profissionais (Agentes de Segurança)
CREATE TABLE IF NOT EXISTS public.professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  disponivel BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT false,
  aprovado BOOLEAN DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garantir compatibilidade e atualização automática de esquemas já existentes
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- Tabela de Chamados / Pedidos de Serviço
CREATE TABLE IF NOT EXISTS public.service_requests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  professional_id TEXT,
  professional_name TEXT,
  professional_phone TEXT,
  professional_email TEXT,
  service_type TEXT NOT NULL CHECK (
    service_type IN (
      'Escolta VIP',
      'Patrimonial Temporário',
      'Acompanhamento de Veículos ou Pessoas',
      'Cobertura de Evento Privado',
      'Escolta de Cargas'
    )
  ),
  address TEXT NOT NULL,
  is_immediate BOOLEAN DEFAULT true,
  scheduled_date_time TEXT,
  observations TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('Pendente', 'Atribuído', 'A caminho', 'Em andamento', 'Concluído', 'Cancelado')
  ) DEFAULT 'Pendente',
  accepted BOOLEAN DEFAULT false,
  panic_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Alertas de Pânico / Emergência
CREATE TABLE IF NOT EXISTS public.panic_alerts (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  request_code TEXT NOT NULL,
  service_type TEXT NOT NULL,
  address TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  professional_id TEXT,
  professional_name TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitação de Índices para Performance
CREATE INDEX IF NOT EXISTS idx_requests_client ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_professional ON public.service_requests(professional_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_panic_resolved ON public.panic_alerts(resolved);

-- 3. Habilitação do Supabase Realtime (Permite sincronização instantânea sem recarregar tela)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'service_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'panic_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.panic_alerts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'professionals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.professionals;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'clients'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_accounts;
  END IF;
END $$;

-- 4. Habilitação de Row Level Security (RLS) Permissiva para o Aplicativo
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Anon acesso completo user_accounts" ON public.user_accounts;
CREATE POLICY "Anon acesso completo user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso completo clients" ON public.clients;
CREATE POLICY "Anon acesso completo clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso completo professionals" ON public.professionals;
CREATE POLICY "Anon acesso completo professionals" ON public.professionals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso completo service_requests" ON public.service_requests;
CREATE POLICY "Anon acesso completo service_requests" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon acesso completo panic_alerts" ON public.panic_alerts;
CREATE POLICY "Anon acesso completo panic_alerts" ON public.panic_alerts FOR ALL USING (true) WITH CHECK (true);

-- 5. Carga de Dados Inicial:
-- Nenhum profissional cadastrado (base limpa).
-- Apenas o Administrador oficial TRANSEG provisionado com as credenciais solicitadas.

INSERT INTO public.user_accounts (id, name, email, phone, role, is_email_verified, password)
VALUES
  ('admin-master', 'Administrador TRANSEG', 'transeg.app@gmail.com', '(27) 3300-8000', 'admin', true, 'Transeg@2026')
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    is_email_verified = true;
