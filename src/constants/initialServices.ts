import { AdminServiceItem } from '../types';

export const INITIAL_ADMIN_SERVICES: AdminServiceItem[] = [
  {
    id: 'serv-1',
    name: 'Escolta Armada VIP',
    category: 'Escolta VIP',
    tag: 'ESCOLTA VIP',
    description: 'Equipe tática armada de alta qualificação com viatura executiva e agentes homologados pela PF para proteção executiva integral.',
    basePrice: 250,
    hourlyRate: 120,
    defaultHours: 4,
    availableHours: [2, 4, 8, 12],
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    complements: [
      { id: 'comp-1', name: 'Viatura Blindada Nível III-A', price: 150 },
      { id: 'comp-2', name: 'Agente Tático Adicional', price: 100 },
      { id: 'comp-3', name: 'Canal Direto Rádio CCO', price: 30 }
    ],
    active: true,
  },
  {
    id: 'serv-2',
    name: 'Vigilância Patrimonial Temporária',
    category: 'Patrimonial',
    tag: 'PATRIMONIAL',
    description: 'Segurança patrimonial ostensiva para condomínios, empresas, comércios e residências com registro em posto fixo e ronda tática.',
    basePrice: 180,
    hourlyRate: 85,
    defaultHours: 8,
    availableHours: [4, 8, 12, 24],
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    complements: [
      { id: 'comp-4', name: 'Ronda com Viatura Caracterizada', price: 80 },
      { id: 'comp-5', name: 'Cão de Guarda Adestrado K9', price: 120 },
      { id: 'comp-6', name: 'Bastão Eletrônico Ronda RondaWeb', price: 25 }
    ],
    active: true,
  },
  {
    id: 'serv-3',
    name: 'Acompanhamento de Veículos ou Pessoas',
    category: 'Tático',
    tag: 'ACOMPANHAMENTO',
    description: 'Acompanhamento velado ou ostensivo de rotas urbanas e rodoviárias em tempo real com apoio da Central de Monitoramento CCO.',
    basePrice: 220,
    hourlyRate: 110,
    defaultHours: 4,
    availableHours: [2, 4, 6, 8],
    image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
    complements: [
      { id: 'comp-7', name: 'Rastreador GPS Satelital Portátil', price: 50 },
      { id: 'comp-8', name: 'Batedor com Motocicleta Ágil', price: 90 }
    ],
    active: true,
  },
  {
    id: 'serv-4',
    name: 'Cobertura de Evento Privado',
    category: 'Eventos',
    tag: 'EVENTOS',
    description: 'Controle de acesso, triagem e segurança preventiva para confraternizações corporativas, eventos sociais e recepções exclusivas.',
    basePrice: 320,
    hourlyRate: 130,
    defaultHours: 6,
    availableHours: [4, 6, 8, 12],
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    complements: [
      { id: 'comp-9', name: 'Pórtico Detector de Metais', price: 140 },
      { id: 'comp-10', name: 'Coordenador Operacional de Pista', price: 110 },
      { id: 'comp-11', name: 'Rádios HT Digitais com Fone', price: 40 }
    ],
    active: true,
  },
  {
    id: 'serv-5',
    name: 'Escolta de Cargas & Mercadorias',
    category: 'Cargas',
    tag: 'ESCOLTA CARGA',
    description: 'Proteção armada rodoviária de alto valor agregado com viatura caracterizada e rastreamento telemetrizado ponto a ponto.',
    basePrice: 400,
    hourlyRate: 150,
    defaultHours: 8,
    availableHours: [4, 8, 12, 16],
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    complements: [
      { id: 'comp-12', name: 'Isca Eletrônica de Carga Descartável', price: 85 },
      { id: 'comp-13', name: 'Viatura Blindada com Escolta Dupla', price: 220 }
    ],
    active: true,
  },
  {
    id: 'serv-6',
    name: 'Ronda Noturna & Pronta-Resposta 24h',
    category: 'Tático',
    tag: 'RONDA NOTURNA',
    description: 'Vistoria periódica noturna de perímetro com sinalização luminosa, verificação de portões e pronto-despacho em caso de disparo.',
    basePrice: 150,
    hourlyRate: 75,
    defaultHours: 4,
    availableHours: [2, 4, 8, 12],
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
    complements: [
      { id: 'comp-14', name: 'Inspeção com Farol de Busca 360°', price: 35 },
      { id: 'comp-15', name: 'Apoio com Drone Noturno Térmico', price: 130 }
    ],
    active: true,
  }
];
