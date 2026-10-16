export type UserRole = 'cliente' | 'profissional' | 'admin';

export type ServiceType = 
  | 'Escolta VIP'
  | 'Patrimonial Temporário'
  | 'Acompanhamento de Veículos ou Pessoas'
  | 'Cobertura de Evento Privado'
  | 'Escolta de Cargas';

export const ALL_SERVICE_TYPES: ServiceType[] = [
  'Escolta VIP',
  'Patrimonial Temporário',
  'Acompanhamento de Veículos ou Pessoas',
  'Cobertura de Evento Privado',
  'Escolta de Cargas'
];

export type ServiceStatus = 
  | 'Pendente'
  | 'Atribuído'
  | 'A caminho'
  | 'Em andamento'
  | 'Concluído'
  | 'Cancelado';

export const ORDERED_SERVICE_STATUSES: ServiceStatus[] = [
  'Pendente',
  'Atribuído',
  'A caminho',
  'Em andamento',
  'Concluído',
  'Cancelado'
];

export interface ClientEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface ProfessionalEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  disponivel: boolean; // controlado pelo próprio profissional
  ativo: boolean;      // controlado pelo admin
  aprovado: boolean;   // controlado pelo admin
  createdAt: string;
  // Telemetria e Geolocalização em Tempo Real (GPS)
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  lastLocationUpdate?: string | null;
}

export interface ServiceRequestParty {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface ServiceRequest {
  id: string;
  code: string; // ex: TR-8942
  client: ServiceRequestParty;
  professional: ServiceRequestParty | null;
  serviceType: ServiceType;
  address: string;
  isImmediate: boolean;
  scheduledDateTime?: string;
  observations?: string;
  status: ServiceStatus;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Optional convenience fields
  panicTriggered?: boolean;
  durationHours?: number;
  totalPrice?: number;
  complements?: string[];
}

export interface PanicAlert {
  id: string;
  requestId: string;
  requestCode: string;
  serviceType: ServiceType;
  address: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  professionalId?: string;
  professionalName?: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  password?: string;
}

export interface ServiceComplement {
  id: string;
  name: string;
  price: number;
}

export interface AdminServiceItem {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  basePrice: number;
  hourlyRate: number;
  defaultHours: number;
  availableHours: number[];
  image: string;
  complements: ServiceComplement[];
  active: boolean;
}

export interface ClientSessionInfo {
  name: string;
  phone: string;
}

