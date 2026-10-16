import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UserRole, 
  ServiceRequest, 
  ServiceType, 
  ServiceStatus,
  ProfessionalEntity, 
  ClientEntity, 
  PanicAlert, 
  UserAccount,
  AdminServiceItem,
  ClientSessionInfo
} from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROFESSIONALS, 
  INITIAL_REQUESTS, 
  INITIAL_PANIC_ALERTS, 
  INITIAL_ACCOUNTS 
} from '../constants/initialData';
import { INITIAL_ADMIN_SERVICES } from '../constants/initialServices';
import { playPanicAlarmSound } from '../utils/sound';
import { 
  supabase, 
  isSupabaseConfigured, 
  fetchAllFromSupabase, 
  upsertRequestInSupabase, 
  upsertPanicAlertInSupabase, 
  upsertProfessionalInSupabase, 
  upsertClientInSupabase, 
  upsertAccountInSupabase, 
  mapDbRequestToModel, 
  mapDbPanicToModel, 
  testSupabaseConnection,
  updateProfessionalLocationInSupabase
} from '../lib/supabase';

export interface SupabaseStatusState {
  configured: boolean;
  connected: boolean;
  message: string;
  testing: boolean;
  lastSync?: string;
}

interface AppContextType {
  // Authentication & Current User
  currentUser: UserAccount | null;
  currentRole: UserRole;
  setCurrentUser: (user: UserAccount | null) => void;
  loginUser: (email: string, role: UserRole, password?: string) => { success: boolean; message?: string };
  logoutUser: () => void;
  registerUser: (data: {
    name: string;
    email: string;
    phone: string;
    role: 'cliente' | 'profissional';
    password?: string;
  }) => { success: boolean; verificationRequired: boolean; message: string };
  verifyEmail: (email: string, code: string) => { success: boolean; message: string };
  switchDemoUser: (targetRole: UserRole, targetId?: string) => void;

  // Client Session (Validação sem senha pelo Nome e Telefone)
  clientSession: ClientSessionInfo | null;
  setClientSession: (session: ClientSessionInfo | null) => void;
  getRequestsByClient: (name: string, phone: string) => ServiceRequest[];

  // Data Collections (Scoped by permission)
  myRequests: ServiceRequest[];       // Strictly filtered by role/user
  allRequests: ServiceRequest[];      // Full collection (admin only)
  professionals: ProfessionalEntity[];
  clients: ClientEntity[];
  panicAlerts: PanicAlert[];
  activePanicAlerts: PanicAlert[];

  // Catálogo de Serviços cadastrados pelo Admin
  adminServices: AdminServiceItem[];
  addAdminService: (service: AdminServiceItem) => { success: boolean; message?: string };
  updateAdminService: (id: string, updates: Partial<AdminServiceItem>) => { success: boolean; message?: string };
  deleteAdminService: (id: string) => { success: boolean; message?: string };
  toggleAdminServiceActive: (id: string) => { success: boolean; message?: string };

  // Request Actions
  createServiceRequest: (data: {
    serviceType: ServiceType;
    address: string;
    isImmediate: boolean;
    scheduledDateTime?: string;
    observations?: string;
    clientName?: string;
    clientPhone?: string;
    durationHours?: number;
    totalPrice?: number;
    complements?: string[];
  }) => { success: boolean; request?: ServiceRequest; message?: string };
  
  cancelServiceRequest: (requestId: string) => { success: boolean; message?: string };
  assignProfessionalToRequest: (requestId: string, professionalId: string) => { success: boolean; message?: string };
  acceptAssignedRequest: (requestId: string) => { success: boolean; message?: string };
  declineAssignedRequest: (requestId: string) => { success: boolean; message?: string };
  advanceRequestStatus: (requestId: string) => { success: boolean; nextStatus?: ServiceStatus; message?: string };

  // Panic Alert Actions
  triggerPanicAlert: (requestId: string) => { success: boolean; alert?: PanicAlert; message?: string };
  resolvePanicAlert: (alertId: string) => { success: boolean; message?: string };

  // Professional Management Actions
  toggleMyAvailability: () => { success: boolean; message?: string };
  approveProfessional: (professionalId: string) => { success: boolean; message?: string };
  toggleProfessionalActive: (professionalId: string) => { success: boolean; message?: string };
  adminCreateProfessional: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => { success: boolean; message?: string };
  updateProfessionalLocation: (coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }) => void;

  // Active view helper
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  clientTab: 'inicio' | 'nova_solicitacao' | 'meus_pedidos' | 'historico' | 'agenda';
  setClientTab: (tab: 'inicio' | 'nova_solicitacao' | 'meus_pedidos' | 'historico' | 'agenda') => void;
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;

  // Supabase Integration & Diagnostics
  supabaseStatus: SupabaseStatusState;
  refreshFromSupabase: () => Promise<void>;
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Real-time broadcast channel name (fallback for multiple browser tabs without backend)
const BROADCAST_CHANNEL_NAME = 'transeg_realtime_sync';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core State with LocalStorage persistence
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('transeg_accounts_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('transeg_session_user_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });

  const [clients, setClients] = useState<ClientEntity[]>(() => {
    const saved = localStorage.getItem('transeg_clients_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CLIENTS;
  });

  const [professionals, setProfessionals] = useState<ProfessionalEntity[]>(() => {
    const saved = localStorage.getItem('transeg_professionals_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PROFESSIONALS;
  });

  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    localStorage.removeItem('transeg_requests_v3');
    localStorage.removeItem('transeg_requests_v2');
    return [];
  });

  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>(() => {
    localStorage.removeItem('transeg_panic_alerts_v3');
    localStorage.removeItem('transeg_panic_alerts_v2');
    return [];
  });

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<'inicio' | 'nova_solicitacao' | 'meus_pedidos' | 'historico' | 'agenda'>('inicio');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Catálogo de Serviços cadastrados pelo Admin
  const [adminServices, setAdminServices] = useState<AdminServiceItem[]>(() => {
    const saved = localStorage.getItem('transeg_admin_services_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ADMIN_SERVICES;
  });

  // Sessão do cliente (Sempre zerado no reinício do app conforme especificado pelo usuário)
  const [clientSession, setClientSessionState] = useState<ClientSessionInfo | null>(() => {
    // Os dados do cliente devem sempre estar sem ser preenchido, toda vez que o app reiniciar deve estar zerado.
    try {
      localStorage.removeItem('transeg_client_session_v1');
      sessionStorage.removeItem('transeg_client_session_v1');
    } catch {
      // ignore
    }
    return null;
  });

  const setClientSession = useCallback((session: ClientSessionInfo | null) => {
    setClientSessionState(session);
  }, []);

  useEffect(() => {
    localStorage.setItem('transeg_admin_services_v1', JSON.stringify(adminServices));
  }, [adminServices]);

  // Supabase Integration State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatusState>({
    configured: isSupabaseConfigured(),
    connected: false,
    message: isSupabaseConfigured() ? 'Conectando ao Supabase...' : 'Aguardando credenciais no ambiente.',
    testing: false,
  });

  // Helper to persist and notify across tabs/components
  const broadcastSync = useCallback((type: string) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ type, timestamp: Date.now() });
        channel.close();
      }
    } catch {
      // BroadcastChannel optional fallback
    }
  }, []);

  // Sync to LocalStorage on updates (ensures seamless resilience)
  useEffect(() => {
    localStorage.setItem('transeg_accounts_v3', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('transeg_session_user_v3', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('transeg_session_user_v3');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('transeg_clients_v3', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('transeg_professionals_v3', JSON.stringify(professionals));
  }, [professionals]);

  useEffect(() => {
    localStorage.setItem('transeg_requests_v3', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('transeg_panic_alerts_v3', JSON.stringify(panicAlerts));
  }, [panicAlerts]);

  // Method to fetch data from Supabase and synchronize with local state
  const refreshFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setSupabaseStatus(prev => ({ ...prev, testing: true }));
    try {
      const connTest = await testSupabaseConnection();
      if (!connTest.connected) {
        setSupabaseStatus({
          configured: true,
          connected: false,
          message: connTest.message,
          testing: false,
        });
        return;
      }

      const remoteData = await fetchAllFromSupabase();
      if (remoteData.requests !== null) {
        setRequests(remoteData.requests);
      }
      if (remoteData.professionals !== null) {
        setProfessionals(remoteData.professionals);
      }
      if (remoteData.clients !== null) {
        setClients(remoteData.clients);
      }
      if (remoteData.panicAlerts !== null) {
        setPanicAlerts(remoteData.panicAlerts);
      }
      if (remoteData.accounts !== null) {
        setAccounts(prev => {
          const merged = [...remoteData.accounts!];
          for (const a of prev) {
            if (!merged.some(x => x.id === a.id || x.email.toLowerCase() === a.email.toLowerCase())) {
              merged.push(a);
            }
          }
          return merged;
        });
      }

      setSupabaseStatus({
        configured: true,
        connected: true,
        message: connTest.message || 'Conectado e sincronizado com o Supabase!',
        testing: false,
        lastSync: new Date().toLocaleTimeString('pt-BR'),
      });
    } catch (err: any) {
      setSupabaseStatus(prev => ({
        ...prev,
        connected: false,
        message: err?.message || 'Falha na sincronização com o Supabase',
        testing: false,
      }));
    }
  }, []);

  // Supabase initialization and Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    refreshFromSupabase();

    // Setup Supabase Realtime channel
    const channel = supabase
      .channel('transeg_supabase_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = mapDbRequestToModel(payload.new);
            setRequests(prev => {
              if (prev.some(r => r.id === newReq.id)) return prev;
              return [newReq, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReq = mapDbRequestToModel(payload.new);
            setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'panic_alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAlert = mapDbPanicToModel(payload.new);
            setPanicAlerts(prev => {
              if (prev.some(a => a.id === newAlert.id)) return prev;
              return [newAlert, ...prev];
            });
            if (!newAlert.resolved) {
              playPanicAlarmSound();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlert = mapDbPanicToModel(payload.new);
            setPanicAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
          } else if (payload.eventType === 'DELETE') {
            setPanicAlerts(prev => prev.filter(a => a.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'professionals' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const p = payload.new as any;
            const updatedPro: ProfessionalEntity = {
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
              createdAt: p.created_at || new Date().toISOString(),
            };
            setProfessionals(prev => {
              const exists = prev.some(item => item.id === updatedPro.id);
              if (exists) {
                return prev.map(item => item.id === updatedPro.id ? updatedPro : item);
              }
              return [...prev, updatedPro];
            });
          } else if (payload.eventType === 'DELETE') {
            setProfessionals(prev => prev.filter(p => p.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const c = payload.new as any;
            const updatedClient: ClientEntity = {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              createdAt: c.created_at || new Date().toISOString(),
            };
            setClients(prev => {
              const exists = prev.some(item => item.id === updatedClient.id);
              if (exists) return prev.map(item => item.id === updatedClient.id ? updatedClient : item);
              return [...prev, updatedClient];
            });
          } else if (payload.eventType === 'DELETE') {
            setClients(prev => prev.filter(c => c.id !== (payload.old as any).id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_accounts' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const a = payload.new as any;
            const updatedAcc: UserAccount = {
              id: a.id,
              name: a.name,
              email: a.email,
              phone: a.phone,
              role: a.role,
              isEmailVerified: Boolean(a.is_email_verified),
              password: a.password || undefined,
            };
            setAccounts(prev => {
              const exists = prev.some(item => item.id === updatedAcc.id);
              if (exists) return prev.map(item => item.id === updatedAcc.id ? updatedAcc : item);
              return [...prev, updatedAcc];
            });
          } else if (payload.eventType === 'DELETE') {
            setAccounts(prev => prev.filter(a => a.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSupabaseStatus(prev => ({
            ...prev,
            connected: true,
            message: 'Realtime ativo! Sincronização em tempo real operacional.',
          }));
        }
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshFromSupabase]);

  // Listen to cross-tab BroadcastChannel and storage events for real-time updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      const savedRequests = localStorage.getItem('transeg_requests_v2');
      if (savedRequests) {
        try { setRequests(JSON.parse(savedRequests)); } catch {}
      }
      const savedAlerts = localStorage.getItem('transeg_panic_alerts_v2');
      if (savedAlerts) {
        try { setPanicAlerts(JSON.parse(savedAlerts)); } catch {}
      }
      const savedPros = localStorage.getItem('transeg_professionals_v2');
      if (savedPros) {
        try { setProfessionals(JSON.parse(savedPros)); } catch {}
      }
      const savedClients = localStorage.getItem('transeg_clients_v2');
      if (savedClients) {
        try { setClients(JSON.parse(savedClients)); } catch {}
      }
    };

    window.addEventListener('storage', handleStorageUpdate);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        handleStorageUpdate();
        if (event.data?.type === 'PANIC_TRIGGERED') {
          // Play sound for emergency
          playPanicAlarmSound();
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      if (channel) channel.close();
    };
  }, []);

  // Compute active panic alerts
  const activePanicAlerts = useMemo(() => {
    return panicAlerts.filter(a => !a.resolved);
  }, [panicAlerts]);

  // Current Role
  const currentRole: UserRole = currentUser?.role || 'cliente';

  // Strict data permission filtering (incluindo filtro por Nome e Telefone do cliente)
  const myRequests = useMemo(() => {
    if (!currentUser || currentUser.role === 'cliente') {
      const clientId = currentUser?.id;
      const sessionPhoneDigits = clientSession?.phone ? clientSession.phone.replace(/\D/g, '') : '';
      const sessionNameLower = clientSession?.name ? clientSession.name.trim().toLowerCase() : '';

      return requests.filter(r => {
        if (clientId && r.client.id === clientId) return true;
        if (sessionPhoneDigits && r.client.phone) {
          const reqDigits = r.client.phone.replace(/\D/g, '');
          if (reqDigits && (reqDigits.includes(sessionPhoneDigits) || sessionPhoneDigits.includes(reqDigits))) {
            return true;
          }
        }
        if (sessionNameLower && r.client.name) {
          const reqName = r.client.name.trim().toLowerCase();
          if (reqName.includes(sessionNameLower) || sessionNameLower.includes(reqName)) {
            return true;
          }
        }
        if (!clientId && !sessionPhoneDigits && !sessionNameLower) {
          return r.client.id === 'client-guest' || !r.client.id;
        }
        return false;
      });
    }
    if (currentUser.role === 'admin') {
      return requests;
    }
    if (currentUser.role === 'profissional') {
      return requests.filter(r => r.professional?.id === currentUser.id);
    }
    return [];
  }, [requests, currentUser, clientSession]);

  // Consulta sob demanda por Nome e Telefone (conforme requisito do cliente)
  const getRequestsByClient = useCallback((name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = name.trim().toLowerCase();

    return requests.filter(r => {
      const rPhone = r.client.phone ? r.client.phone.replace(/\D/g, '') : '';
      const rName = r.client.name ? r.client.name.trim().toLowerCase() : '';

      const phoneMatches = cleanPhone.length >= 6 && (rPhone.includes(cleanPhone) || cleanPhone.includes(rPhone));
      const nameMatches = cleanName.length >= 2 && (rName.includes(cleanName) || cleanName.includes(rName));

      return phoneMatches || nameMatches;
    });
  }, [requests]);

  // Authentication methods
  const loginUser = useCallback((email: string, role: UserRole, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts.find(
      acc => acc.email.toLowerCase() === normalizedEmail && acc.role === role
    );

    if (!account) {
      return { 
        success: false, 
        message: `Nenhuma conta com o email "${email}" foi localizada para o papel ${role.toUpperCase()}.` 
      };
    }

    if (account.password && password && account.password !== password) {
      return {
        success: false,
        message: 'Senha incorreta para esta conta.'
      };
    }

    if (!account.isEmailVerified) {
      return { 
        success: false, 
        message: 'Email ainda não confirmado. Por favor, confirme seu código de verificação para prosseguir.' 
      };
    }

    setCurrentUser(account);
    setSelectedRequestId(null);
    return { success: true };
  }, [accounts]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    setSelectedRequestId(null);
  }, []);

  const registerUser = useCallback((data: {
    name: string;
    email: string;
    phone: string;
    role: 'cliente' | 'profissional';
    password?: string;
  }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = accounts.find(a => a.email.toLowerCase() === normalizedEmail && a.role === data.role);
    if (existing) {
      return { 
        success: false, 
        verificationRequired: false, 
        message: `Já existe um cadastro com este email para o papel ${data.role.toUpperCase()}.` 
      };
    }

    const newId = data.role === 'cliente' ? `cli-${Date.now()}` : `pro-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newAccount: UserAccount = {
      id: newId,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      role: data.role,
      isEmailVerified: false, // Requer verificação por código
      password: data.password || 'senha123',
    };

    setAccounts(prev => [...prev, newAccount]);
    upsertAccountInSupabase(newAccount);

    if (data.role === 'cliente') {
      const newClient: ClientEntity = {
        id: newId,
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone.trim(),
        createdAt: nowIso,
      };
      setClients(prev => [...prev, newClient]);
      upsertClientInSupabase(newClient);
    } else {
      // Profissional recém-cadastrado entra como pendente de aprovação
      const newPro: ProfessionalEntity = {
        id: newId,
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone.trim(),
        disponivel: false,
        ativo: false,
        aprovado: false, // Pendente de aprovação pelo admin
        createdAt: nowIso,
      };
      setProfessionals(prev => [...prev, newPro]);
      upsertProfessionalInSupabase(newPro);
    }

    broadcastSync('USER_REGISTERED');

    return { 
      success: true, 
      verificationRequired: true, 
      message: 'Cadastro iniciado! Um código de verificação foi gerado (Use: 123456 para validação).' 
    };
  }, [accounts, broadcastSync]);

  const verifyEmail = useCallback((email: string, code: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts.find(a => a.email.toLowerCase() === normalizedEmail);

    if (!account) {
      return { success: false, message: 'Conta não localizada.' };
    }

    // Demo verification code (accepts 123456 or any 6 digits for testing)
    if (code.trim() !== '123456' && code.trim().length !== 6) {
      return { success: false, message: 'Código incorreto. Use o código de teste "123456".' };
    }

    const updatedAccount = { ...account, isEmailVerified: true };
    setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
    upsertAccountInSupabase(updatedAccount);
    setCurrentUser(updatedAccount);
    broadcastSync('EMAIL_VERIFIED');

    return { success: true, message: 'Email confirmado com sucesso! Bem-vindo à TRANSEG.' };
  }, [accounts, broadcastSync]);

  const switchDemoUser = useCallback((targetRole: UserRole, targetId?: string) => {
    if (targetRole === 'admin') {
      const adminAcc = accounts.find(a => a.role === 'admin') || INITIAL_ACCOUNTS[0];
      setCurrentUser(adminAcc);
      setSelectedRequestId(null);
      return;
    }

    if (targetRole === 'cliente') {
      const clientAcc = targetId 
        ? accounts.find(a => a.id === targetId && a.role === 'cliente')
        : accounts.find(a => a.role === 'cliente');
      if (clientAcc) {
        setCurrentUser(clientAcc);
        setSelectedRequestId(null);
      }
      return;
    }

    if (targetRole === 'profissional') {
      const proAcc = targetId
        ? accounts.find(a => a.id === targetId && a.role === 'profissional')
        : accounts.find(a => a.role === 'profissional');
      if (proAcc) {
        setCurrentUser(proAcc);
        setSelectedRequestId(null);
      }
    }
  }, [accounts]);

  // Catálogo de Serviços - Métodos de Gerenciamento do Admin
  const addAdminService = useCallback((service: AdminServiceItem) => {
    setAdminServices(prev => [service, ...prev]);
    broadcastSync('SERVICES_UPDATED');
    return { success: true, message: 'Serviço cadastrado com sucesso no catálogo!' };
  }, [broadcastSync]);

  const updateAdminService = useCallback((id: string, updates: Partial<AdminServiceItem>) => {
    setAdminServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    broadcastSync('SERVICES_UPDATED');
    return { success: true, message: 'Serviço atualizado com sucesso!' };
  }, [broadcastSync]);

  const deleteAdminService = useCallback((id: string) => {
    setAdminServices(prev => prev.filter(s => s.id !== id));
    broadcastSync('SERVICES_UPDATED');
    return { success: true, message: 'Serviço removido com sucesso!' };
  }, [broadcastSync]);

  const toggleAdminServiceActive = useCallback((id: string) => {
    setAdminServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    broadcastSync('SERVICES_UPDATED');
    return { success: true };
  }, [broadcastSync]);

  // Request Business Logic
  const createServiceRequest = useCallback((data: {
    serviceType: ServiceType;
    address: string;
    isImmediate: boolean;
    scheduledDateTime?: string;
    observations?: string;
    clientName?: string;
    clientPhone?: string;
    durationHours?: number;
    totalPrice?: number;
    complements?: string[];
  }) => {
    // Clientes têm acesso livre sem necessidade de credenciais prévias
    if (currentUser && currentUser.role !== 'cliente') {
      return { success: false, message: 'Apenas clientes podem solicitar serviços.' };
    }

    if (!data.address.trim()) {
      return { success: false, message: 'O endereço ou local da operação é obrigatório.' };
    }

    if (!data.isImmediate) {
      if (!data.scheduledDateTime) {
        return { success: false, message: 'Data e horário são obrigatórios para agendamento prévio.' };
      }
      const scheduledDate = new Date(data.scheduledDateTime);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() < Date.now()) {
        return { success: false, message: 'A data do agendamento deve ser futura.' };
      }
    }

    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const code = `TR-${codeNum}`;
    const newId = `req-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const clientName = data.clientName?.trim() || currentUser?.name || clientSession?.name || 'Cliente Solicitante';
    const clientPhone = data.clientPhone?.trim() || currentUser?.phone || clientSession?.phone || '(27) 3300-8000';
    const clientEmail = currentUser?.email || 'cliente@transeg.app';
    const clientId = currentUser?.id || (clientPhone ? `cli-${clientPhone.replace(/\D/g, '')}` : 'client-guest');

    // Persistir sessão do cliente para consultas futuras sem senha
    if (data.clientName || data.clientPhone) {
      setClientSession({ name: clientName, phone: clientPhone });
    }

    const newRequest: ServiceRequest = {
      id: newId,
      code,
      client: {
        id: clientId,
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
      },
      professional: null,
      serviceType: data.serviceType,
      address: data.address.trim(),
      isImmediate: data.isImmediate,
      scheduledDateTime: data.scheduledDateTime,
      observations: data.observations?.trim() || undefined,
      status: 'Pendente',
      accepted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      durationHours: data.durationHours,
      totalPrice: data.totalPrice,
      complements: data.complements,
    };

    setRequests(prev => [newRequest, ...prev]);
    setSelectedRequestId(newId);
    upsertRequestInSupabase(newRequest);
    broadcastSync('REQUEST_CREATED');

    return { success: true, request: newRequest, message: `Solicitação ${code} criada com sucesso!` };
  }, [currentUser, clientSession, setClientSession, broadcastSync]);

  const cancelServiceRequest = useCallback((requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Pedido não encontrado.' };

    // Regra: Cliente pode cancelar enquanto o pedido estiver Pendente ou Atribuído
    if (req.status !== 'Pendente' && req.status !== 'Atribuído') {
      return { 
        success: false, 
        message: 'Este pedido não pode mais ser cancelado pois o atendimento já foi iniciado ou concluído.' 
      };
    }

    const nowIso = new Date().toISOString();
    let updatedReq: ServiceRequest | null = null;
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, status: 'Cancelado', updatedAt: nowIso };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      upsertRequestInSupabase(updatedReq);
    }
    broadcastSync('REQUEST_CANCELLED');
    return { success: true, message: `Pedido ${req.code} cancelado.` };
  }, [requests, broadcastSync]);

  const assignProfessionalToRequest = useCallback((requestId: string, professionalId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Pedido não encontrado.' };
    if (req.status !== 'Pendente') {
      return { success: false, message: 'Apenas pedidos com status Pendente podem receber atribuição.' };
    }

    const pro = professionals.find(p => p.id === professionalId);
    if (!pro) return { success: false, message: 'Profissional não encontrado.' };

    // Regra: Profissional deve estar aprovado e ativo
    if (!pro.aprovado || !pro.ativo) {
      return { success: false, message: 'O profissional selecionado não está aprovado ou ativo.' };
    }

    const nowIso = new Date().toISOString();
    let updatedReq: ServiceRequest | null = null;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: 'Atribuído',
          accepted: false,
          professional: {
            id: pro.id,
            name: pro.name,
            phone: pro.phone,
            email: pro.email,
          },
          updatedAt: nowIso,
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      upsertRequestInSupabase(updatedReq);
    }
    broadcastSync('PROFESSIONAL_ASSIGNED');
    return { success: true, message: `Profissional ${pro.name} atribuído ao chamado ${req.code}.` };
  }, [requests, professionals, broadcastSync]);

  const acceptAssignedRequest = useCallback((requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Chamado não encontrado.' };
    if (req.status !== 'Atribuído') {
      return { success: false, message: 'O chamado não está no status Atribuído.' };
    }

    const nowIso = new Date().toISOString();
    let updatedReq: ServiceRequest | null = null;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          accepted: true,
          updatedAt: nowIso,
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      upsertRequestInSupabase(updatedReq);
    }
    broadcastSync('REQUEST_ACCEPTED');
    return { success: true, message: `Chamado ${req.code} aceito com sucesso!` };
  }, [requests, broadcastSync]);

  const declineAssignedRequest = useCallback((requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Chamado não encontrado.' };
    if (req.status !== 'Atribuído') {
      return { success: false, message: 'O chamado não está no status Atribuído.' };
    }

    // Regra: Profissional recusa → volta para Pendente, profissional removido
    const nowIso = new Date().toISOString();
    let updatedReq: ServiceRequest | null = null;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: 'Pendente',
          professional: null,
          accepted: false,
          updatedAt: nowIso,
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      upsertRequestInSupabase(updatedReq);
    }
    broadcastSync('REQUEST_DECLINED');
    return { success: true, message: `Chamado ${req.code} recusado. Retornado para a central CCO.` };
  }, [requests, broadcastSync]);

  const advanceRequestStatus = useCallback((requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Chamado não encontrado.' };
    if (!req.accepted) {
      return { success: false, message: 'O chamado precisa ser aceito antes de avançar status.' };
    }

    let nextStatus: ServiceStatus;
    if (req.status === 'Atribuído') {
      nextStatus = 'A caminho';
    } else if (req.status === 'A caminho') {
      nextStatus = 'Em andamento';
    } else if (req.status === 'Em andamento') {
      nextStatus = 'Concluído';
    } else {
      return { success: false, message: 'Este chamado já atingiu status final.' };
    }

    const nowIso = new Date().toISOString();
    let updatedReq: ServiceRequest | null = null;

    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = {
          ...r,
          status: nextStatus,
          updatedAt: nowIso,
        };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      upsertRequestInSupabase(updatedReq);
    }
    broadcastSync('STATUS_ADVANCED');
    return { success: true, nextStatus, message: `Status atualizado para: ${nextStatus}` };
  }, [requests, broadcastSync]);

  // Panic Button Actions
  const triggerPanicAlert = useCallback((requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Pedido não localizado.' };

    const alertId = `sos-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newAlert: PanicAlert = {
      id: alertId,
      requestId: req.id,
      requestCode: req.code,
      serviceType: req.serviceType,
      address: req.address,
      clientId: req.client.id,
      clientName: req.client.name,
      clientPhone: req.client.phone,
      professionalId: req.professional?.id,
      professionalName: req.professional?.name,
      createdAt: nowIso,
      resolved: false,
    };

    setPanicAlerts(prev => [newAlert, ...prev]);
    upsertPanicAlertInSupabase(newAlert);

    // Mark panic on request
    let updatedReq: ServiceRequest | null = null;
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        updatedReq = { ...r, panicTriggered: true, updatedAt: nowIso };
        return updatedReq;
      }
      return r;
    }));

    if (updatedReq) {
      upsertRequestInSupabase(updatedReq);
    }

    // Play alert sound immediately
    playPanicAlarmSound();
    broadcastSync('PANIC_TRIGGERED');

    return { 
      success: true, 
      alert: newAlert, 
      message: 'Alerta de emergência emitido! A Central de Operações foi notificada.' 
    };
  }, [requests, broadcastSync]);

  const resolvePanicAlert = useCallback((alertId: string) => {
    const nowIso = new Date().toISOString();
    let targetRequestId: string | undefined;
    let updatedAlert: PanicAlert | null = null;

    setPanicAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        targetRequestId = a.requestId;
        updatedAlert = {
          ...a,
          resolved: true,
          resolvedAt: nowIso,
        };
        return updatedAlert;
      }
      return a;
    }));

    if (updatedAlert) {
      upsertPanicAlertInSupabase(updatedAlert);
    }

    // If no other active alerts for this request, clear panicTriggered
    if (targetRequestId) {
      let updatedReq: ServiceRequest | null = null;
      setRequests(prev => prev.map(r => {
        if (r.id === targetRequestId) {
          updatedReq = { ...r, panicTriggered: false, updatedAt: nowIso };
          return updatedReq;
        }
        return r;
      }));
      if (updatedReq) {
        upsertRequestInSupabase(updatedReq);
      }
    }

    broadcastSync('PANIC_RESOLVED');
    return { success: true, message: 'Alerta de pânico marcado como resolvido pela central.' };
  }, [broadcastSync]);

  // Professional Controls
  const toggleMyAvailability = useCallback(() => {
    if (!currentUser || currentUser.role !== 'profissional') {
      return { success: false, message: 'Apenas profissionais podem alterar disponibilidade.' };
    }

    const pro = professionals.find(p => p.id === currentUser.id);
    if (!pro) return { success: false, message: 'Perfil do profissional não encontrado.' };

    // Regra: Só pode ficar "disponível" se ativo E aprovado
    if (!pro.aprovado || !pro.ativo) {
      return { 
        success: false, 
        message: 'Você só pode ficar disponível quando sua conta estiver aprovada e ativada pelo administrador.' 
      };
    }

    const nextAvailability = !pro.disponivel;
    let updatedPro: ProfessionalEntity | null = null;

    setProfessionals(prev => prev.map(p => {
      if (p.id === currentUser.id) {
        updatedPro = { ...p, disponivel: nextAvailability };
        return updatedPro;
      }
      return p;
    }));

    if (updatedPro) {
      upsertProfessionalInSupabase(updatedPro);
    }

    broadcastSync('AVAILABILITY_CHANGED');
    return { 
      success: true, 
      message: nextAvailability ? 'Você agora está DISPONÍVEL para chamados.' : 'Você agora está INDISPONÍVEL.' 
    };
  }, [currentUser, professionals, broadcastSync]);

  const approveProfessional = useCallback((professionalId: string) => {
    let updatedPro: ProfessionalEntity | null = null;

    setProfessionals(prev => prev.map(p => {
      if (p.id === professionalId) {
        // Regra: "Aprovar cadastro" aprova e ativa de uma vez
        updatedPro = { ...p, aprovado: true, ativo: true };
        return updatedPro;
      }
      return p;
    }));

    if (updatedPro) {
      upsertProfessionalInSupabase(updatedPro);
    }

    broadcastSync('PROFESSIONAL_APPROVED');
    return { success: true, message: 'Profissional aprovado e ativado com sucesso!' };
  }, [broadcastSync]);

  const toggleProfessionalActive = useCallback((professionalId: string) => {
    let updatedPro: ProfessionalEntity | null = null;

    setProfessionals(prev => prev.map(p => {
      if (p.id === professionalId) {
        const nextActive = !p.ativo;
        updatedPro = { 
          ...p, 
          ativo: nextActive,
          // Se desativado, também fica indisponível para receber chamados
          disponivel: nextActive ? p.disponivel : false,
        };
        return updatedPro;
      }
      return p;
    }));

    if (updatedPro) {
      upsertProfessionalInSupabase(updatedPro);
    }

    broadcastSync('PROFESSIONAL_ACTIVE_TOGGLED');
    return { success: true, message: 'Status de ativação do profissional alterado.' };
  }, [broadcastSync]);

  const adminCreateProfessional = useCallback((data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
  }) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = accounts.find(a => a.email.toLowerCase() === normalizedEmail && a.role === 'profissional');
    if (existing) {
      return { success: false, message: 'Já existe um profissional cadastrado com este e-mail.' };
    }

    const newId = `pro-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newPro: ProfessionalEntity = {
      id: newId,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      disponivel: true,
      ativo: true,
      aprovado: true, // Já aprovado e ativo
      createdAt: nowIso,
    };

    const newAccount: UserAccount = {
      id: newId,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone.trim(),
      role: 'profissional',
      isEmailVerified: true,
      password: data.password || 'senha123',
    };

    setProfessionals(prev => [...prev, newPro]);
    setAccounts(prev => [...prev, newAccount]);

    upsertProfessionalInSupabase(newPro);
    upsertAccountInSupabase(newAccount);

    broadcastSync('PROFESSIONAL_CREATED_BY_ADMIN');

    return { success: true, message: `Profissional ${newPro.name} cadastrado e ativado!` };
  }, [accounts, broadcastSync]);

  const updateProfessionalLocation = useCallback((coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }) => {
    if (!currentUser || currentUser.role !== 'profissional') return;
    const nowIso = new Date().toISOString();

    setProfessionals(prev => prev.map(p => {
      if (p.id === currentUser.id) {
        return {
          ...p,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? null,
          heading: coords.heading ?? null,
          speed: coords.speed ?? null,
          lastLocationUpdate: nowIso,
        };
      }
      return p;
    }));

    updateProfessionalLocationInSupabase(currentUser.id, coords);
  }, [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    currentRole,
    setCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    verifyEmail,
    switchDemoUser,
    myRequests,
    allRequests: requests,
    professionals,
    clients,
    panicAlerts,
    activePanicAlerts,
    createServiceRequest,
    cancelServiceRequest,
    assignProfessionalToRequest,
    acceptAssignedRequest,
    declineAssignedRequest,
    advanceRequestStatus,
    triggerPanicAlert,
    resolvePanicAlert,
    toggleMyAvailability,
    approveProfessional,
    toggleProfessionalActive,
    adminCreateProfessional,
    updateProfessionalLocation,
    selectedRequestId,
    setSelectedRequestId,
    clientTab,
    setClientTab,
    isBookingModalOpen,
    setIsBookingModalOpen,
    adminServices,
    addAdminService,
    updateAdminService,
    deleteAdminService,
    toggleAdminServiceActive,
    clientSession,
    setClientSession,
    getRequestsByClient,
    supabaseStatus,
    refreshFromSupabase,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  }), [
    currentUser,
    currentRole,
    loginUser,
    logoutUser,
    registerUser,
    verifyEmail,
    switchDemoUser,
    myRequests,
    requests,
    professionals,
    clients,
    panicAlerts,
    activePanicAlerts,
    adminServices,
    addAdminService,
    updateAdminService,
    deleteAdminService,
    toggleAdminServiceActive,
    clientSession,
    setClientSession,
    getRequestsByClient,
    createServiceRequest,
    cancelServiceRequest,
    assignProfessionalToRequest,
    acceptAssignedRequest,
    declineAssignedRequest,
    advanceRequestStatus,
    triggerPanicAlert,
    resolvePanicAlert,
    toggleMyAvailability,
    approveProfessional,
    toggleProfessionalActive,
    adminCreateProfessional,
    updateProfessionalLocation,
    selectedRequestId,
    clientTab,
    isBookingModalOpen,
    setIsBookingModalOpen,
    supabaseStatus,
    refreshFromSupabase,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
