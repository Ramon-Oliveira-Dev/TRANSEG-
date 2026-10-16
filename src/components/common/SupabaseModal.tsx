import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  X, 
  ExternalLink,
  Shield,
  Radio,
  FileCode,
  Terminal,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { supabaseStatus, refreshFromSupabase } = useApp();
  const config = getSupabaseConfig();

  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult({
        tested: true,
        success: res.connected,
        message: res.message,
        latency: res.latencyMs,
      });
      if (res.connected) {
        await refreshFromSupabase();
      }
    } catch (e: any) {
      setTestResult({
        tested: true,
        success: false,
        message: e?.message || 'Falha ao conectar com o Supabase',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyEnv = () => {
    const envSnippet = `# Configuração TRANSEG no Supabase (.env)
VITE_SUPABASE_URL="${config.url || 'https://hlqrdpvlapdtrxhgonvh.supabase.co'}"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica-aqui"`;
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleCopySql = () => {
    const sqlCode = `-- TRANSEG TECNOLOGIAS DE SEGURANÇA — ESQUEMA COMPLETO SUPABASE
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

CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- Garantir adição de colunas em bancos já criados
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

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
  service_type TEXT NOT NULL,
  address TEXT NOT NULL,
  is_immediate BOOLEAN DEFAULT true,
  scheduled_date_time TEXT,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente',
  accepted BOOLEAN DEFAULT false,
  panic_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Ativar Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'service_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests, public.panic_alerts, public.professionals, public.clients, public.user_accounts;
  END IF;
END $$;

-- RLS (Row Level Security)
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo professionals" ON public.professionals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo service_requests" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo panic_alerts" ON public.panic_alerts FOR ALL USING (true) WITH CHECK (true);

-- Carga Inicial: Administrador homologado TRANSEG (nenhum profissional pré-cadastrado)
INSERT INTO public.user_accounts (id, name, email, phone, role, is_email_verified, password)
VALUES ('admin-master', 'Administrador TRANSEG', 'transeg.app@gmail.com', '(27) 3300-8000', 'admin', true, 'Transeg@2026')
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, role = EXCLUDED.role, name = EXCLUDED.name, is_email_verified = true;
`;
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D1B]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F1C38] border border-[#16264A] rounded-[12px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] font-body">
        {/* Header */}
        <div className="px-6 py-4 bg-[#060D1B] border-b border-[#16264A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#0A1428] border border-[#FFC20E]/40 flex items-center justify-center text-[#16A34A]">
              <Database className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base tracking-wide uppercase">
                  Conexão Supabase
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  PostgreSQL & Realtime
                </span>
              </div>
              <p className="text-xs text-[#8E9BAE]">
                Sincronização em tempo real de chamados, profissionais e alertas de pânico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] bg-[#0A1428] text-[#8E9BAE] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Badge Card */}
          <div className={`p-4 rounded-[12px] border ${
            supabaseStatus.connected
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              : config.isConfigured
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
              : 'bg-[#0A1428] border-[#16264A] text-[#C3CBDA]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  supabaseStatus.connected 
                    ? 'bg-emerald-400 animate-pulse' 
                    : config.isConfigured 
                    ? 'bg-amber-400' 
                    : 'bg-[#8E9BAE]'
                }`} />
                <div>
                  <div className="font-display font-bold uppercase tracking-wider text-white text-xs">
                    {supabaseStatus.connected
                      ? 'SUPABASE CONECTADO & SINCRONIZANDO'
                      : config.isConfigured
                      ? 'CREDENCIAIS DETECTADAS — TESTANDO'
                      : 'AGUARDANDO CREDENCIAIS NO AMBIENTE'}
                  </div>
                  <p className="text-xs text-[#8E9BAE] mt-0.5 font-body">
                    {supabaseStatus.connected
                      ? `Projeto ativo com replicação de eventos em tempo real.`
                      : config.isConfigured
                      ? 'Credenciais encontradas no ambiente. Clique em Testar Conexão para validar.'
                      : 'O app está operando em modo local seguro com persistência e broadcast de abas.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="btn-yellow !py-1.5 !px-3 text-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'TESTANDO...' : 'TESTAR CONEXÃO'}</span>
              </button>
            </div>

            {/* Test Diagnostic Output */}
            {testResult && (
              <div className={`mt-3 pt-3 border-t text-xs ${
                testResult.success
                  ? 'border-emerald-500/30 text-emerald-300'
                  : 'border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Steps Guide */}
          <div className="space-y-3">
            <h4 className="font-brand-title font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFC20E]" />
              Como ativar suas credenciais
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-[6px] bg-[#060D1B] border border-[#16264A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#FFC20E] uppercase tracking-wider">
                    Passo 1: Variáveis de Ambiente
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEnv}
                    className="text-[10px] text-[#8E9BAE] hover:text-white flex items-center gap-1"
                  >
                    {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedEnv ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="text-xs text-[#8E9BAE]">
                  Configure no arquivo <code className="text-white bg-[#0F1C38] px-1 py-0.5 rounded">.env</code> as duas chaves que você tem do Supabase:
                </p>
                <div className="bg-[#0A1428] p-2 rounded text-[11px] font-mono text-[#C3CBDA] overflow-x-auto border border-[#16264A]">
                  <div>VITE_SUPABASE_URL="https://seu-projeto.supabase.co"</div>
                  <div>VITE_SUPABASE_ANON_KEY="eyJhbG..."</div>
                </div>
                <p className="text-[11px] text-[#8E9BAE]">
                  (Dica: você também pode colar suas credenciais no chat para configurarmos diretamente!)
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-[6px] bg-[#060D1B] border border-[#16264A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#FFC20E] uppercase tracking-wider">
                    Passo 2: Executar Script SQL
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="text-[10px] text-[#8E9BAE] hover:text-white flex items-center gap-1"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedSql ? 'Copiado!' : 'Copiar SQL'}
                  </button>
                </div>
                <p className="text-xs text-[#8E9BAE]">
                  No painel do Supabase, vá em <strong>SQL Editor</strong>, cole e clique em <strong>Run</strong> para criar as tabelas com suporte a Realtime e RLS.
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="w-full py-2 px-3 rounded-[4px] bg-[#0F1C38] hover:bg-[#16264A] border border-[#16264A] text-xs text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#3ECF8E]" />
                  {copiedSql ? 'SQL Copiado para a Área de Transferência!' : 'Copiar Script SQL do Esquema'}
                </button>
              </div>
            </div>
          </div>

          {/* Tables Overview */}
          <div className="p-3.5 rounded-[6px] bg-[#060D1B] border border-[#16264A]">
            <h5 className="text-[11px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#FFC20E]" />
              Tabelas incluídas no esquema TRANSEG
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-[#0A1428] px-2.5 py-1.5 rounded border border-[#16264A] text-[#C3CBDA]">
                • <span className="text-[#FFC20E]">service_requests</span>
              </div>
              <div className="bg-[#0A1428] px-2.5 py-1.5 rounded border border-[#16264A] text-[#C3CBDA]">
                • <span className="text-[#FFC20E]">panic_alerts</span>
              </div>
              <div className="bg-[#0A1428] px-2.5 py-1.5 rounded border border-[#16264A] text-[#C3CBDA]">
                • <span className="text-[#FFC20E]">professionals</span>
              </div>
              <div className="bg-[#0A1428] px-2.5 py-1.5 rounded border border-[#16264A] text-[#C3CBDA]">
                • <span className="text-[#FFC20E]">clients</span>
              </div>
              <div className="bg-[#0A1428] px-2.5 py-1.5 rounded border border-[#16264A] text-[#C3CBDA]">
                • <span className="text-[#FFC20E]">user_accounts</span>
              </div>
              <div className="bg-[#0A1428] px-2.5 py-1.5 rounded border border-[#16264A] text-emerald-400">
                • <span className="text-emerald-400">supabase_realtime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#060D1B] border-t border-[#16264A] flex items-center justify-between text-xs text-[#8E9BAE]">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#FFC20E]" />
            Arquitetura resiliente com fallback local automático
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[4px] bg-[#0F1C38] hover:bg-[#16264A] text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
