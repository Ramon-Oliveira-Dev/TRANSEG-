import { ClientEntity, ProfessionalEntity, ServiceRequest, PanicAlert, UserAccount } from '../types';

export const INITIAL_CLIENTS: ClientEntity[] = [];

export const INITIAL_PROFESSIONALS: ProfessionalEntity[] = [];

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin-master',
    name: 'Administrador TRANSEG',
    email: 'transeg.app@gmail.com',
    phone: '(27) 3300-8000',
    role: 'admin',
    isEmailVerified: true,
    password: 'Transeg@2026',
  },
];

export const INITIAL_REQUESTS: ServiceRequest[] = [];

export const INITIAL_PANIC_ALERTS: PanicAlert[] = [];
