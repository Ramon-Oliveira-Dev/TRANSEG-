import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ClientEntity, 
  ProfessionalEntity, 
  ServiceRequest, 
  PanicAlert, 
  UserAccount 
} from '../types';

/**
 * Normaliza e higieniza a URL do Supabase, removendo sufixos acidentais como /rest/v1
 * ou barras extras ao final que causam 'Invalid path specified in request URL'.
 */
export function cleanSupabaseUrl(url?: string | null): string {
  if (!url) return '';
  let cleaned = url.trim();
  // Remove /rest/v1 ou /rest/v1/ ao final
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  // Remove barras ao final
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

// Credenciais primárias e de fallback oficial do projeto provisionado
const FALLBACK_SUPABASE_URL = 'https://hlqrdpvlapdtrxhgonvh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscXJkcHZsYXBkdHJ4aGdvbnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NjI4NjMsImV4cCI6MjEwNzMzODg2M30.N958z3xkDAWdIKYvCZoprGcgqqGXAI-CRTHlqScJY_I';

export function getActiveSupabaseUrl(): string {
  const envUrl = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  if (envUrl && !envUrl.includes('seu-projeto.supabase.co')) {
    return envUrl;
  }
  return FALLBACK_SUPABASE_URL;
}

export function getActiveSupabaseKey(): string {
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (envKey && envKey.length > 20 && !envKey.includes('sua-chave-anon')) {
    return envKey;
  }
  return FALLBACK_SUPABASE_ANON_KEY;
}

// Valida se as credenciais configuradas são legítimas e ativas
export const isSupabaseConfigured = (): boolean => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();
  return Boolean(
    url && 
    key && 
    (url.startsWith('https://') || url.startsWith('http://')) &&
    !url.includes('seu-projeto.supabase.co') &&
    key.length > 20
  );
};

export const getSupabaseConfig = () => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();
  return {
    url,
    isConfigured: isSupabaseConfigured(),
    hasUrl: Boolean(url),
    hasKey: Boolean(key && key.length > 20),
  };
};

// Instância Singleton do cliente Supabase
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(getActiveSupabaseUrl(), getActiveSupabaseKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Teste diagnóstico completo da conexão e verificação de todas as 5 tabelas
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tablesFound?: string[];
  latencyMs?: number;
}> {
  if (!supabase) {
    return {
      connected: false,
      message: 'Credenciais do Supabase não inicializadas.',
    };
  }

  const startTime = performance.now();

  try {
    // 1. Testa consulta da tabela principal service_requests
    const { error: reqError } = await supabase
      .from('service_requests')
      .select('id')
      .limit(1);

    const latency = Math.round(performance.now() - startTime);

    if (reqError) {
      if (reqError.code === '42P01') {
        return {
          connected: false,
          message: 'Conectado ao Supabase, mas as tabelas ainda não foram criadas. Execute o script supabase_schema.sql no SQL Editor.',
          latencyMs: latency,
        };
      }
      return {
        connected: false,
        message: `Erro ao consultar Supabase: ${reqError.message} (${reqError.code || 'sem código'})`,
        latencyMs: latency,
      };
    }

    // 2. Confirma as demais tabelas
    const [panicRes, proRes, cliRes, accRes] = await Promise.all([
      supabase.from('panic_alerts').select('id').limit(1),
      supabase.from('professionals').select('id').limit(1),
      supabase.from('clients').select('id').limit(1),
      supabase.from('user_accounts').select('id').limit(1),
    ]);

    const tablesFound = ['service_requests'];
    if (!panicRes.error) tablesFound.push('panic_alerts');
    if (!proRes.error) tablesFound.push('professionals');
    if (!cliRes.error) tablesFound.push('clients');
    if (!accRes.error) tablesFound.push('user_accounts');

    return {
      connected: true,
      message: `Conexão bem-sucedida! ${tablesFound.length}/5 tabelas verificadas e prontas (${latency}ms).`,
      tablesFound,
      latencyMs: latency,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Falha na requisição: ${err?.message || 'Erro de rede ou URL inválida.'}`,
    };
  }
}

// -------------------------------------------------------------
// Data Mapping Helpers (TypeScript camelCase <-> Postgres snake_case)
// -------------------------------------------------------------

export function mapDbRequestToModel(row: any): ServiceRequest {
  return {
    id: row.id,
    code: row.code,
    client: {
      id: row.client_id,
      name: row.client_name,
      phone: row.client_phone,
      email: row.client_email || '',
    },
    professional: row.professional_id
      ? {
          id: row.professional_id,
          name: row.professional_name || '',
          phone: row.professional_phone || '',
          email: row.professional_email || '',
        }
      : null,
    serviceType: row.service_type,
    address: row.address,
    isImmediate: Boolean(row.is_immediate),
    scheduledDateTime: row.scheduled_date_time || undefined,
    observations: row.observations || undefined,
    status: row.status,
    accepted: Boolean(row.accepted),
    panicTriggered: Boolean(row.panic_triggered),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapModelRequestToDb(req: ServiceRequest) {
  return {
    id: req.id,
    code: req.code,
    client_id: req.client.id,
    client_name: req.client.name,
    client_phone: req.client.phone,
    client_email: req.client.email || null,
    professional_id: req.professional?.id || null,
    professional_name: req.professional?.name || null,
    professional_phone: req.professional?.phone || null,
    professional_email: req.professional?.email || null,
    service_type: req.serviceType,
    address: req.address,
    is_immediate: req.isImmediate,
    scheduled_date_time: req.scheduledDateTime || null,
    observations: req.observations || null,
    status: req.status,
    accepted: req.accepted,
    panic_triggered: Boolean(req.panicTriggered),
    created_at: req.createdAt,
    updated_at: req.updatedAt,
  };
}

export function mapDbPanicToModel(row: any): PanicAlert {
  return {
    id: row.id,
    requestId: row.request_id,
    requestCode: row.request_code,
    serviceType: row.service_type,
    address: row.address,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    professionalId: row.professional_id || undefined,
    professionalName: row.professional_name || undefined,
    resolved: Boolean(row.resolved),
    resolvedAt: row.resolved_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapModelPanicToDb(panic: PanicAlert) {
  return {
    id: panic.id,
    request_id: panic.requestId,
    request_code: panic.requestCode,
    service_type: panic.serviceType,
    address: panic.address,
    client_id: panic.clientId,
    client_name: panic.clientName,
    client_phone: panic.clientPhone,
    professional_id: panic.professionalId || null,
    professional_name: panic.professionalName || null,
    resolved: panic.resolved,
    resolved_at: panic.resolvedAt || null,
    created_at: panic.createdAt,
  };
}

// -------------------------------------------------------------
// Operações no Banco de Dados (CRUD e Sincronização)
// -------------------------------------------------------------

export async function fetchAllFromSupabase(): Promise<{
  requests: ServiceRequest[] | null;
  professionals: ProfessionalEntity[] | null;
  clients: ClientEntity[] | null;
  panicAlerts: PanicAlert[] | null;
  accounts: UserAccount[] | null;
  error?: string;
}> {
  if (!supabase) return { requests: null, professionals: null, clients: null, panicAlerts: null, accounts: null };

  try {
    const [reqRes, proRes, cliRes, sosRes, accRes] = await Promise.all([
      supabase.from('service_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('professionals').select('*').order('created_at', { ascending: true }),
      supabase.from('clients').select('*').order('created_at', { ascending: true }),
      supabase.from('panic_alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('user_accounts').select('*'),
    ]);

    const requests = reqRes.data ? reqRes.data.map(mapDbRequestToModel) : null;
    const professionals = proRes.data ? proRes.data.map((p: any): ProfessionalEntity => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      disponivel: Boolean(p.disponivel),
      ativo: Boolean(p.ativo),
      aprovado: Boolean(p.aprovado),
      latitude: p.latitude !== null && p.latitude !== undefined ? Number(p.latitude) : null,
      longitude: p.longitude !== null && p.longitude !== undefined ? Number(p.longitude) : null,
      accuracy: p.accuracy !== null && p.accuracy !== undefined ? Number(p.accuracy) : null,
      heading: p.heading !== null && p.heading !== undefined ? Number(p.heading) : null,
      speed: p.speed !== null && p.speed !== undefined ? Number(p.speed) : null,
      lastLocationUpdate: p.last_location_update || null,
      createdAt: p.created_at,
    })) : null;

    const clients = cliRes.data ? cliRes.data.map((c: any): ClientEntity => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.created_at,
    })) : null;

    const panicAlerts = sosRes.data ? sosRes.data.map(mapDbPanicToModel) : null;

    const accounts = accRes.data ? accRes.data.map((a: any): UserAccount => ({
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      role: a.role,
      isEmailVerified: Boolean(a.is_email_verified),
      password: a.password || undefined,
    })) : null;

    return {
      requests,
      professionals,
      clients,
      panicAlerts,
      accounts,
    };
  } catch (err: any) {
    console.error('[Supabase fetch error]:', err);
    return {
      requests: null,
      professionals: null,
      clients: null,
      panicAlerts: null,
      accounts: null,
      error: err.message,
    };
  }
}

export async function upsertRequestInSupabase(req: ServiceRequest) {
  if (!supabase) return;
  try {
    const dbPayload = mapModelRequestToDb(req);
    await supabase.from('service_requests').upsert(dbPayload, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase upsert request error]:', e);
  }
}

export async function upsertPanicAlertInSupabase(alert: PanicAlert) {
  if (!supabase) return;
  try {
    const dbPayload = mapModelPanicToDb(alert);
    await supabase.from('panic_alerts').upsert(dbPayload, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase upsert panic error]:', e);
  }
}

export async function upsertProfessionalInSupabase(pro: ProfessionalEntity) {
  if (!supabase) return;
  try {
    await supabase.from('professionals').upsert({
      id: pro.id,
      name: pro.name,
      email: pro.email,
      phone: pro.phone,
      disponivel: pro.disponivel,
      ativo: pro.ativo,
      aprovado: pro.aprovado,
      latitude: pro.latitude ?? null,
      longitude: pro.longitude ?? null,
      accuracy: pro.accuracy ?? null,
      heading: pro.heading ?? null,
      speed: pro.speed ?? null,
      last_location_update: pro.lastLocationUpdate ?? null,
      created_at: pro.createdAt,
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase upsert pro error]:', e);
  }
}

/**
 * Atualiza periodicamente a posição geográfica (GPS) do profissional no Supabase
 */
export async function updateProfessionalLocationInSupabase(
  professionalId: string,
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase não conectado' };
  }
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('professionals')
      .update({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? null,
        heading: coords.heading ?? null,
        speed: coords.speed ?? null,
        last_location_update: nowIso,
      })
      .eq('id', professionalId);

    if (error) {
      console.warn('[Supabase location update error]:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase location update exception]:', err);
    return { success: false, error: err?.message || 'Falha ao atualizar localização' };
  }
}

export async function upsertClientInSupabase(cli: ClientEntity) {
  if (!supabase) return;
  try {
    await supabase.from('clients').upsert({
      id: cli.id,
      name: cli.name,
      email: cli.email,
      phone: cli.phone,
      created_at: cli.createdAt,
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase upsert client error]:', e);
  }
}

export async function upsertAccountInSupabase(acc: UserAccount) {
  if (!supabase) return;
  try {
    await supabase.from('user_accounts').upsert({
      id: acc.id,
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      role: acc.role,
      is_email_verified: acc.isEmailVerified,
      password: acc.password || null,
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase upsert account error]:', e);
  }
}
