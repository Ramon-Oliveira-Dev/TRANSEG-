import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Zap, 
  PhoneCall, 
  ChevronRight, 
  ArrowLeft,
  XCircle,
  Shield,
  X,
  Siren,
  Building,
  Users,
  Car,
  Truck,
  Flame,
  MessageCircle,
  Volume2,
  AlertTriangle,
  RotateCcw,
  Check,
  Search,
  Sparkles,
  Layers,
  Phone,
  User,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceType, ALL_SERVICE_TYPES, AdminServiceItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { StatusStepper } from '../common/StatusStepper';
import { SectionHeader } from '../common/SectionHeader';
import { 
  FullscreenSelectModal, 
  FullscreenSelectTrigger,
  FullscreenSelectOption 
} from '../common/FullscreenSelectModal';
import { TacticalScheduleModal } from '../common/TacticalScheduleModal';
import { BookingStepperModal } from './booking/BookingStepperModal';
import { playPanicAlarmSound } from '../../utils/sound';
import { formatPhoneBR } from '../../utils/phone';
import { useBackHandler } from '../../hooks/useBackHandler';

export const ClientDashboard: React.FC = () => {
  const { 
    myRequests, 
    allRequests,
    createServiceRequest, 
    cancelServiceRequest, 
    selectedRequestId, 
    setSelectedRequestId,
    clientTab: activeTab,
    setClientTab: setActiveTab,
    isBookingModalOpen,
    setIsBookingModalOpen,
    triggerPanicAlert,
    resolvePanicAlert,
    activePanicAlerts,
    adminServices,
    clientSession,
    setClientSession,
    getRequestsByClient
  } = useApp();

  // Form states for "Nova Solicitação" manual
  const [serviceType, setServiceType] = useState<ServiceType>('Escolta VIP');
  const [address, setAddress] = useState('');
  const [isImmediate, setIsImmediate] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [observations, setObservations] = useState('');
  
  // Validation / Feedback states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Quick modals for home interactions
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // ---------------------------------------------------------------------------
  // ESTADOS DOS CARDS DE SERVIÇOS & BARRA FLUTUANTE (Screenshot_20261013-181158)
  // ---------------------------------------------------------------------------
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  
  // Map of hours per service: { [serviceId]: hours }
  const [serviceHoursMap, setServiceHoursMap] = useState<Record<string, number>>({});
  
  // Map of selected complements per service: { [serviceId]: complementId[] }
  const [serviceComplementsMap, setServiceComplementsMap] = useState<Record<string, string[]>>({});
  
  // Array of selected services: { serviceId: string; hours: number; complements: string[] }
  const [selectedServices, setSelectedServices] = useState<Array<{
    serviceId: string;
    hours: number;
    complements: string[];
  }>>([]);

  // Modal de Agendamento do Botão Flutuante
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingIsImmediate, setBookingIsImmediate] = useState(true);
  const [bookingDateTime, setBookingDateTime] = useState('');
  const [bookingObservations, setBookingObservations] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // ESTADOS DA CONSULTA DE AGENDA & CHAMADOS (Sempre zerados no início)
  // ---------------------------------------------------------------------------
  const [lookupName, setLookupName] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Botão nativo de voltar retorna da tela de detalhes do chamado para a listagem
  useBackHandler({
    id: `client-request-detail-${selectedRequestId}`,
    active: selectedRequestId !== null && !isBookingModalOpen,
    onBack: () => setSelectedRequestId(null)
  });

  // Botão nativo de voltar fecha o modal de agendamento manual
  useBackHandler({
    id: 'client-manual-booking-modal',
    active: showBookingModal && !isBookingModalOpen,
    onBack: () => setShowBookingModal(false)
  });

  // Botão nativo de voltar fecha o modal de seleção de tipo de serviço
  useBackHandler({
    id: 'client-service-type-modal',
    active: showServiceTypeModal,
    onBack: () => setShowServiceTypeModal(false)
  });

  // Botão nativo de voltar fecha o modal de horário tático
  useBackHandler({
    id: 'client-schedule-modal',
    active: showScheduleModal,
    onBack: () => setShowScheduleModal(false)
  });

  // Botão nativo de voltar retorna para a tela inicial (catálogo de serviços)
  useBackHandler({
    id: `client-tab-${activeTab}`,
    active: activeTab !== 'inicio' && !isBookingModalOpen && selectedRequestId === null && !showBookingModal && !showServiceTypeModal && !showScheduleModal,
    onBack: () => setActiveTab('inicio')
  });

  // Categorias únicas dos serviços ativos
  const serviceCategories = useMemo(() => {
    const cats = Array.from(new Set(adminServices.filter(s => s.active).map(s => s.category)));
    return ['Todos', ...cats];
  }, [adminServices]);

  // Serviços filtrados pela categoria selecionada
  const filteredServices = useMemo(() => {
    return adminServices.filter(s => {
      if (!s.active) return false;
      if (selectedCategory === 'Todos') return true;
      return s.category === selectedCategory;
    });
  }, [adminServices, selectedCategory]);

  // Helper para obter horas selecionadas de um card
  const getCardHours = (service: AdminServiceItem) => {
    return serviceHoursMap[service.id] || service.defaultHours || 4;
  };

  // Helper para calcular o preço de um serviço com horas e complementos
  const calculateServicePrice = (service: AdminServiceItem, hours: number, compIds: string[]) => {
    const base = service.basePrice;
    const extraHours = Math.max(0, hours - service.defaultHours);
    const hourlyAddition = extraHours * service.hourlyRate;
    const compsTotal = (service.complements || [])
      .filter(c => compIds.includes(c.id))
      .reduce((sum, c) => sum + c.price, 0);
    return base + hourlyAddition + compsTotal;
  };

  // Toggle seleção de um serviço
  const handleToggleSelectService = (service: AdminServiceItem) => {
    const isSelected = selectedServices.some(s => s.serviceId === service.id);
    const hours = getCardHours(service);
    const comps = serviceComplementsMap[service.id] || [];

    if (isSelected) {
      setSelectedServices(prev => prev.filter(s => s.serviceId !== service.id));
    } else {
      setSelectedServices(prev => [
        ...prev,
        {
          serviceId: service.id,
          hours,
          complements: comps,
        }
      ]);
    }
  };

  // Alterar horas de um serviço
  const handleChangeHours = (serviceId: string, hours: number) => {
    setServiceHoursMap(prev => ({ ...prev, [serviceId]: hours }));
    // Se o serviço já estiver selecionado, atualiza também a seleção
    setSelectedServices(prev => prev.map(s => {
      if (s.serviceId === serviceId) {
        return { ...s, hours };
      }
      return s;
    }));
  };

  // Toggle complemento de um serviço
  const handleToggleComplement = (serviceId: string, compId: string) => {
    const current = serviceComplementsMap[serviceId] || [];
    const next = current.includes(compId)
      ? current.filter(id => id !== compId)
      : [...current, compId];

    setServiceComplementsMap(prev => ({ ...prev, [serviceId]: next }));
    // Se o serviço já estiver selecionado, atualiza a seleção
    setSelectedServices(prev => prev.map(s => {
      if (s.serviceId === serviceId) {
        return { ...s, complements: next };
      }
      return s;
    }));
  };

  // Remover serviço da seleção rápida
  const handleRemoveSelectedService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  // Limpar toda a seleção
  const handleClearSelection = () => {
    setSelectedServices([]);
  };

  // Total de horas e valor acumulado dos serviços selecionados
  const { totalSelectedHours, totalSelectedPrice } = useMemo(() => {
    let hours = 0;
    let price = 0;
    for (const item of selectedServices) {
      const srv = adminServices.find(s => s.id === item.serviceId);
      if (srv) {
        hours += item.hours;
        price += calculateServicePrice(srv, item.hours, item.complements);
      }
    }
    return { totalSelectedHours: hours, totalSelectedPrice: price };
  }, [selectedServices, adminServices]);

  // Total de serviços complementares selecionados
  const totalComplementsCount = useMemo(() => {
    return selectedServices.reduce((acc, curr) => acc + (curr.complements?.length || 0), 0);
  }, [selectedServices]);

  // Submeter agendamento a partir do botão flutuante
  const handleConfirmBookingFromFloatingBar = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!bookingName.trim() || bookingName.trim().length < 3) {
      setBookingError('Informe seu Nome Completo para validar o agendamento.');
      return;
    }

    const phoneDigits = bookingPhone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setBookingError('Informe um Número de Telefone / WhatsApp válido.');
      return;
    }

    if (!bookingAddress.trim()) {
      setBookingError('Informe o local da operação ou endereço de atendimento.');
      return;
    }

    if (!bookingIsImmediate && !bookingDateTime) {
      setBookingError('Selecione a data e o horário desejados para o agendamento.');
      return;
    }

    // Salvar na sessão do cliente
    setClientSession({
      name: bookingName.trim(),
      phone: bookingPhone.trim()
    });

    // Pega o primeiro serviço selecionado como tipo principal
    const firstSelected = selectedServices[0];
    const srv = adminServices.find(s => s.id === firstSelected?.serviceId);
    const serviceTitle = (srv?.name || 'Escolta VIP') as ServiceType;

    // Constrói lista de complementos
    const complementNames = selectedServices.flatMap(item => {
      const parentSrv = adminServices.find(s => s.id === item.serviceId);
      return (parentSrv?.complements || [])
        .filter(c => item.complements.includes(c.id))
        .map(c => `${parentSrv?.name}: ${c.name}`);
    });

    const res = createServiceRequest({
      serviceType: serviceTitle,
      address: bookingAddress.trim(),
      isImmediate: bookingIsImmediate,
      scheduledDateTime: bookingIsImmediate ? undefined : bookingDateTime,
      observations: bookingObservations.trim() || undefined,
      clientName: bookingName.trim(),
      clientPhone: bookingPhone.trim(),
      durationHours: totalSelectedHours,
      totalPrice: totalSelectedPrice,
      complements: complementNames,
    });

    if (res.success && res.request) {
      setBookingSuccess('Agendamento confirmado com sucesso!');
      setTimeout(() => {
        setShowBookingModal(false);
        setSelectedServices([]);
        setBookingSuccess(null);
        setSelectedRequestId(res.request!.id);
        setActiveTab('agenda');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1000);
    } else {
      setBookingError(res.message || 'Falha ao processar solicitação.');
    }
  };

  const serviceOptions: FullscreenSelectOption[] = [
    {
      value: 'Escolta VIP',
      label: 'Escolta VIP',
      description: 'Proteção pessoal ostensiva ou velada para executivos, autoridades e familiares com operadores altamente treinados.',
      badge: 'Prioridade Alta',
      badgeColor: 'gold',
      icon: <Shield className="w-5 h-5 text-[#FFC20E]" />,
    },
    {
      value: 'Patrimonial Temporário',
      label: 'Patrimonial Temporário',
      description: 'Posto tático e vigilância presencial avançada para residências, condomínios, empresas e eventos corporativos.',
      badge: 'Guarda Tática',
      badgeColor: 'blue',
      icon: <Building className="w-5 h-5 text-[#FFC20E]" />,
    },
    {
      value: 'Acompanhamento de Veículos ou Pessoas',
      label: 'Acompanhamento de Veículos ou Pessoas',
      description: 'Deslocamento seguro de comboios, veículos blindados ou passageiros em itinerários de risco.',
      badge: 'Pronta Resposta',
      badgeColor: 'green',
      icon: <Car className="w-5 h-5 text-[#FFC20E]" />,
    },
    {
      value: 'Cobertura de Evento Privado',
      label: 'Cobertura de Evento Privado',
      description: 'Controle de perímetro, triagem de acessos, inteligência preventiva e segurança para público restrito.',
      badge: 'Operação Especial',
      badgeColor: 'blue',
      icon: <Users className="w-5 h-5 text-[#FFC20E]" />,
    },
    {
      value: 'Escolta de Cargas',
      label: 'Escolta de Cargas',
      description: 'Equipes operacionais armadas e viaturas dedicadas à custódia e acompanhamento de cargas e ativos de alto valor.',
      badge: 'Blindado / Armado',
      badgeColor: 'red',
      icon: <Truck className="w-5 h-5 text-[#FFC20E]" />,
    },
  ];

  // Active requests (Pendente, Atribuído, A caminho, Em andamento)
  const activeRequests = myRequests.filter(r => 
    r.status === 'Pendente' || 
    r.status === 'Atribuído' || 
    r.status === 'A caminho' || 
    r.status === 'Em andamento'
  );

  // Selected request detail
  const selectedRequest = (allRequests || myRequests).find(r => r.id === selectedRequestId);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!address.trim()) {
      setFormError('Informe o endereço ou local da operação.');
      return;
    }

    if (!isImmediate) {
      if (!scheduledDateTime) {
        setFormError('Selecione data e horário para agendamento prévio.');
        return;
      }
    }

    const res = createServiceRequest({
      serviceType,
      address,
      isImmediate,
      scheduledDateTime: isImmediate ? undefined : scheduledDateTime,
      observations: observations || undefined,
    });

    if (res.success && res.request) {
      setFormSuccess('Solicitação criada com sucesso!');
      setAddress('');
      setScheduledDateTime('');
      setObservations('');
      setTimeout(() => {
        setActiveTab('inicio');
      }, 1000);
    } else {
      setFormError(res.message || 'Falha ao criar chamado.');
    }
  };

  const handleCancelRequest = (reqId: string) => {
    if (confirm('Deseja realmente cancelar esta solicitação de atendimento?')) {
      const res = cancelServiceRequest(reqId);
      if (!res.success) {
        alert(res.message);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 1. SE HOUVER CHAMADO SELECIONADO: VISÃO DETALHADA DO CHAMADO
  // ---------------------------------------------------------------------------
  if (selectedRequest) {
    const activeAlert = activePanicAlerts.find(a => a.requestId === selectedRequest.id && !a.resolved);
    const isPanicMode = Boolean(selectedRequest.panicTriggered || activeAlert);

    if (isPanicMode) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedRequestId(null)}
              className="btn-ghost-dark inline-flex items-center gap-2 text-xs !px-3.5 !py-2 text-[#C3CBDA] hover:text-white font-semibold rounded-[8px] bg-[#0E1A33]/60 hover:bg-[#16264A] border border-[#1E335C] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Início</span>
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DC2626]/20 border border-[#DC2626] text-[#DC2626] text-xs font-chakra font-bold animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <Siren className="w-3.5 h-3.5" />
              SINAL DE PÂNICO ATIVO
            </span>
          </div>

          <div className="relative bg-gradient-to-b from-[#24080D]/95 via-[#120E22]/95 to-[#060D1B]/95 border-2 border-[#DC2626]/80 rounded-[16px] p-5 sm:p-7 space-y-5 backdrop-blur-xl shadow-[0_0_45px_rgba(220,38,38,0.4)] overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#DC2626]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#0E1A33]/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-tactical-grid opacity-15 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DC2626]/30 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#DC2626]/20 border-2 border-[#DC2626] flex items-center justify-center text-[#DC2626] shadow-[0_0_25px_rgba(220,38,38,0.6)] pulse-panic-active shrink-0">
                  <Siren className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <span className="eyebrow text-[#DC2626] block text-[10px] tracking-widest font-chakra font-bold uppercase">
                    ATENDIMENTO PRIORITÁRIO · PROTOCOLO SOS
                  </span>
                  <h1 className="font-chakra font-bold text-xl sm:text-2xl text-white uppercase tracking-wider drop-shadow">
                    Central CCO Acionada em Tempo Real
                  </h1>
                  <p className="text-xs text-[#C3CBDA] mt-0.5">
                    Chamado <strong className="text-white font-mono">{selectedRequest.code}</strong> • Cliente: <strong className="text-white">{selectedRequest.client.name} ({selectedRequest.client.phone})</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => playPanicAlarmSound()}
                  className="px-3 py-1.5 rounded-[8px] bg-[#11203D] hover:bg-[#16264A] text-[#C3CBDA] hover:text-white border border-[#1E335C] text-xs font-chakra font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reproduzir sinal sonoro"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Sinal Sonoro</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="tel:190"
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-[12px] bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white shadow-[0_0_25px_rgba(220,38,38,0.45)] border border-[#DC2626] transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow">
                    <PhoneCall className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-chakra font-bold text-sm sm:text-base tracking-wider uppercase block">
                      Ligar 190 (Polícia Militar)
                    </span>
                    <span className="text-[11px] text-white/90 block">
                      Em caso de perigo imediato à integridade
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
              </a>

              <a
                href={`https://wa.me/552733008000?text=EMERG%C3%8ANCIA%20TRANSEG%20-%20Chamado%20${selectedRequest.code}%20-%20Alerta%20de%20P%C3%A2nico%20Acionado`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 sm:p-4 rounded-[12px] bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-500/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-chakra font-bold text-sm sm:text-base tracking-wider uppercase text-emerald-300 block">
                      Central CCO 24h (WhatsApp)
                    </span>
                    <span className="text-[11px] text-[#C3CBDA] block">
                      Contato direto com a equipe operacional
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400/80 group-hover:translate-x-1 transition-transform shrink-0" />
              </a>
            </div>

            <div className="relative z-10 pt-2 border-t border-[#16264A]/80">
              <div className="text-xs uppercase tracking-wider font-semibold text-[#8E9BAE] mb-3 font-display">
                Progresso do Despacho de Emergência:
              </div>
              <StatusStepper currentStatus={selectedRequest.status} />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-[#0A1020]/80 border border-[#1E2C48] rounded-[12px] p-4 space-y-2.5 backdrop-blur-md">
                <div className="font-chakra font-bold text-white text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#FFC20E]" />
                  <span>Localização e Parâmetros</span>
                </div>
                <div>
                  <span className="text-[#8E9BAE] block text-[11px]">Local da Ocorrência / GPS:</span>
                  <span className="text-white font-semibold text-xs">{selectedRequest.address}</span>
                </div>
                <div>
                  <span className="text-[#8E9BAE] block text-[11px]">Tipo de Atendimento:</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#FFC20E] mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                    Pronta-Resposta Imediata (SOS)
                  </span>
                </div>
                {selectedRequest.observations && (
                  <div>
                    <span className="text-[#8E9BAE] block text-[11px]">Observações:</span>
                    <p className="text-[#C3CBDA] bg-[#060D1B]/80 p-2.5 rounded-[6px] border border-[#16264A] mt-1 font-mono text-[11px]">
                      {selectedRequest.observations}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#0A1020]/80 border border-[#1E2C48] rounded-[12px] p-4 space-y-3 flex flex-col justify-between backdrop-blur-md">
                <div>
                  <div className="font-chakra font-bold text-white text-sm flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-[#FFC20E]" />
                    <span>Equipe Operacional</span>
                  </div>

                  {selectedRequest.professional ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 p-2.5 bg-[#060D1B]/80 rounded-[8px] border border-[#16264A]">
                        <div className="w-9 h-9 rounded-full bg-[#FFC20E] text-[#060D1B] flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                          {selectedRequest.professional.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white text-xs block truncate">
                            {selectedRequest.professional.name}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-semibold block">
                            Viatura / Agente Homologado a Caminho
                          </span>
                        </div>
                      </div>
                      {selectedRequest.professional.phone && (
                        <a
                          href={`tel:${selectedRequest.professional.phone}`}
                          className="w-full inline-flex items-center justify-center gap-1.5 p-2 rounded-[6px] bg-[#11203D] hover:bg-[#16264A] border border-[#1E335C] text-[#C3CBDA] hover:text-white text-xs font-semibold transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-[#FFC20E]" />
                          <span>Ligar para o Agente: {selectedRequest.professional.phone}</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-[#060D1B]/80 border border-[#16264A] rounded-[8px] space-y-1">
                      <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#FFC20E]" />
                        <span>Central CCO localizando viatura mais próxima</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#8E9BAE]">
                        Nossos operadores estão atribuindo a equipe de pronta-resposta em deslocamento para sua localização.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#16264A]/80">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja desativar o alerta de emergência e informar que a situação está segura?')) {
                        if (activeAlert) {
                          resolvePanicAlert(activeAlert.id);
                        } else {
                          cancelServiceRequest(selectedRequest.id);
                        }
                      }
                    }}
                    className="w-full btn-ghost-dark !py-2 text-[11px] text-[#8E9BAE] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Desativar Sinal de Pânico (Falso Alarme)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Visão Normal de Detalhes
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedRequestId(null)}
            className="btn-ghost-dark inline-flex items-center gap-2 text-xs !px-3.5 !py-2 text-[#C3CBDA] hover:text-white font-semibold rounded-[8px] bg-[#0E1A33]/60 hover:bg-[#16264A] border border-[#1E335C] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <StatusBadge status={selectedRequest.status} size="md" />
        </div>

        <div className="relative bg-gradient-to-b from-[#0A1428]/95 via-[#0D1B36]/90 to-[#060D1B]/95 border border-[#1E335C]/80 rounded-[16px] p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FFC20E]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#16264A]/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-tactical-grid opacity-10 pointer-events-none" />

          <div className="relative z-10 border-b border-[#16264A]/80 pb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="eyebrow text-[#FFC20E] block text-[10px] tracking-widest font-display">
                  CHAMADO {selectedRequest.code}
                </span>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-wide mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  {selectedRequest.serviceType}
                </h1>
                <p className="text-xs text-[#8E9BAE] mt-1 font-body">
                  Solicitante: <strong className="text-white">{selectedRequest.client.name}</strong> • Telefone: <strong className="text-white">{selectedRequest.client.phone}</strong>
                </p>
              </div>
              <div className="text-right text-xs text-[#8E9BAE] font-mono">
                <span>Criado em: {new Date(selectedRequest.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#8E9BAE] mb-3 font-display">
              Progresso do Atendimento:
            </div>
            <StatusStepper currentStatus={selectedRequest.status} />
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0E1A33]/70 border border-[#1E335C] rounded-[12px] p-5 space-y-3 backdrop-blur-md">
              <div className="font-display font-bold text-white text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FFC20E]" />
                <span>Localização e Modalidade</span>
              </div>
              <div>
                <span className="text-[#8E9BAE] block text-[11px] font-medium">Endereço / Local da Operação:</span>
                <span className="text-white font-semibold text-xs sm:text-sm">{selectedRequest.address}</span>
              </div>
              <div>
                <span className="text-[#8E9BAE] block text-[11px] font-medium">Tipo de Atendimento:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-white mt-0.5">
                  {selectedRequest.isImmediate ? (
                    <>
                      <Zap className="w-3.5 h-3.5 text-[#FFC20E]" />
                      Pronta-Resposta Imediata
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-[#FFC20E]" />
                      Agendado para: {selectedRequest.scheduledDateTime ? new Date(selectedRequest.scheduledDateTime).toLocaleString('pt-BR') : 'Data informada'}
                    </>
                  )}
                </span>
              </div>
              {selectedRequest.durationHours && (
                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-medium">Duração Contratada:</span>
                  <span className="text-[#FFC20E] font-bold text-xs">{selectedRequest.durationHours} horas de cobertura</span>
                </div>
              )}
              {selectedRequest.totalPrice && (
                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-medium">Valor Total:</span>
                  <span className="text-white font-chakra font-bold text-sm">
                    R$ {selectedRequest.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {selectedRequest.observations && (
                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-medium">Observações:</span>
                  <p className="text-[#C3CBDA] bg-[#0A1428]/80 p-3 rounded-[8px] border border-[#1E335C] mt-1 font-body">
                    {selectedRequest.observations}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[#0E1A33]/70 border border-[#1E335C] rounded-[12px] p-5 space-y-3 flex flex-col justify-between backdrop-blur-md">
              <div className="space-y-3">
                <div className="font-display font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FFC20E]" />
                  <span>Profissional Responsável</span>
                </div>

                {selectedRequest.professional ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#0A1428]/80 rounded-[8px] border border-[#1E335C]">
                      <div className="w-10 h-10 rounded-full bg-[#FFC20E] text-[#060D1B] flex items-center justify-center font-bold text-sm shadow-md">
                        {selectedRequest.professional.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white text-sm block truncate">
                          {selectedRequest.professional.name}
                        </span>
                        <span className="text-[11px] text-[#8E9BAE]">
                          Agente de Segurança Homologado
                        </span>
                      </div>
                    </div>
                    {selectedRequest.professional.phone && (
                      <div className="flex items-center gap-2 text-[#C3CBDA]">
                        <PhoneCall className="w-3.5 h-3.5 text-[#FFC20E]" />
                        <span>Contato: {selectedRequest.professional.phone}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0A1428]/80 border border-[#1E335C] rounded-[8px] text-[#8E9BAE] space-y-1">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#FFC20E]" />
                      <span>Aguardando Atribuição pela Central CCO</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#8E9BAE]">
                      Nossos operadores já estão alocando o profissional tático mais próximo de sua rota.
                    </p>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'Pendente' && (
                <div className="pt-3 border-t border-[#16264A]/80">
                  <button
                    type="button"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="w-full btn-ghost-dark !text-[#DC2626] !border-[#DC2626]/50 hover:!bg-[#DC2626]/20 text-xs !py-2 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelar Chamado</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 1.5. FLUXO DE AGENDAMENTO (Passos 1 a 5 - Renderizado Diretamente Abaixo do Header, Sem Sobreposição)
  // ---------------------------------------------------------------------------
  if (showBookingModal || isBookingModalOpen) {
    return (
      <div className="w-full h-full min-h-0 flex-1 overflow-hidden flex flex-col justify-start px-2 sm:px-4 animate-in fade-in duration-200">
        <BookingStepperModal
          isOpen={true}
          onClose={() => {
            setShowBookingModal(false);
            setIsBookingModalOpen(false);
          }}
          selectedServices={selectedServices}
          adminServices={adminServices}
          totalSelectedHours={totalSelectedHours}
          totalSelectedPrice={totalSelectedPrice}
          initialClientName={clientSession?.name || bookingName}
          initialClientPhone={clientSession?.phone || bookingPhone}
          onChangeHours={handleChangeHours}
          onToggleComplement={handleToggleComplement}
          onViewSchedule={() => {
            setShowBookingModal(false);
            setIsBookingModalOpen(false);
            setActiveTab('agenda');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onConfirm={(data) => {
            const complementNames = selectedServices.flatMap(item => {
              const parentSrv = adminServices.find(s => s.id === item.serviceId);
              return (parentSrv?.complements || [])
                .filter(c => item.complements.includes(c.id))
                .map(c => `${parentSrv?.name}: ${c.name}`);
            });

            const res = createServiceRequest({
              serviceType: (adminServices.find(s => s.id === selectedServices[0]?.serviceId)?.name || 'Serviço') as any,
              address: data.bookingAddress,
              isImmediate: false,
              scheduledDateTime: data.bookingDateTime,
              observations: data.bookingObservations,
              clientName: data.bookingName,
              clientPhone: data.bookingPhone,
              durationHours: totalSelectedHours,
              totalPrice: totalSelectedPrice,
              complements: complementNames,
            });

            if (res.success && res.request) {
               setClientSession({
                 name: data.bookingName.trim(),
                 phone: data.bookingPhone.trim()
               });
               setSelectedServices([]);
               setSelectedRequestId(res.request.id);
               setBookingSuccess('Agendamento confirmado com sucesso!');
               return { success: true, request: res.request };
            } else {
               setBookingError(res.message || 'Erro ao realizar agendamento.');
               return { success: false, message: res.message || 'Erro ao agendar.' };
            }
          }}
          calculateServicePrice={calculateServicePrice}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. TELA DE CONSULTA DE AGENDA & CHAMADOS (Apenas com Nome e Telefone)
  // ---------------------------------------------------------------------------
  if (activeTab === 'agenda' || activeTab === 'meus_pedidos') {
    const userFoundRequests = hasSearched && (lookupPhone.trim() || lookupName.trim())
      ? getRequestsByClient(lookupName, lookupPhone)
      : [];

    return (
      <div className="relative w-full max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
        {/* Card Único: Consultar Meus Chamados e Agendamento */}
        <div className="relative bg-gradient-to-b from-[#0A1428]/95 via-[#0D1B36]/90 to-[#060D1B]/95 border border-[#1E335C] rounded-[20px] p-6 sm:p-8 space-y-5 backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.65)] overflow-hidden">
          
          {/* Topo do Card com botão de retorno */}
          <div className="flex items-center gap-3.5 pb-2 border-b border-[#16264A]/80">
            <button
              type="button"
              onClick={() => setActiveTab('inicio')}
              className="w-8 h-8 rounded-full bg-[#11203D] hover:bg-[#16264A] text-[#C3CBDA] hover:text-[#FFC20E] border border-[#1E335C] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
              title="Voltar ao Início"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-[#FFC20E]/15 border border-[#FFC20E]/30 flex items-center justify-center text-[#FFC20E] shrink-0 shadow-inner">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <span className="eyebrow text-[#FFC20E] text-[10px] tracking-wider block font-chakra font-bold">
                TRANSEG · ÁREA DO CLIENTE
              </span>
              <h2 className="font-chakra font-bold text-base sm:text-xl text-white uppercase tracking-wider">
                Consultar Meus Chamados e Agendamento
              </h2>
              <p className="text-xs text-[#8E9BAE]">
                Informe seu nome completo e telefone com DDD para localizar seus chamados e serviços.
              </p>
            </div>
          </div>

          {/* Feedback de Validação */}
          {lookupFeedback && (
            <div className={`p-3 rounded-[10px] text-xs font-medium flex items-center gap-2 border animate-in fade-in duration-150 ${
              lookupFeedback.type === 'error'
                ? 'bg-red-950/50 border-red-500/50 text-red-200'
                : 'bg-amber-950/40 border-[#FFC20E]/40 text-[#FFC20E]'
            }`}>
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#FFC20E]" />
              <span>{lookupFeedback.message}</span>
            </div>
          )}

          {/* Formulário com Nome e Telefone com DDD */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setLookupFeedback(null);
              const cleanDigits = lookupPhone.replace(/\D/g, '');
              const cleanName = lookupName.trim();

              if (!cleanName && !cleanDigits) {
                setLookupFeedback({
                  type: 'error',
                  message: 'Por favor, informe seu Nome Completo ou Telefone com DDD para pesquisar.'
                });
                return;
              }

              if (cleanDigits && cleanDigits.length < 10) {
                setLookupFeedback({
                  type: 'error',
                  message: 'Informe um telefone com DDD válido no padrão (00) 00000-0000 (mínimo 10 dígitos).'
                });
                return;
              }

              setHasSearched(true);
              if (cleanName || cleanDigits) {
                setClientSession({ name: cleanName, phone: lookupPhone });
              }
            }}
            className="space-y-4 pt-1"
          >
            {/* Campo 1: Nome Completo */}
            <div>
              <label className="block text-[11px] font-chakra font-bold text-[#8E9BAE] uppercase tracking-wider mb-1.5">
                Nome Completo:
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#FFC20E] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={lookupName}
                  onChange={(e) => {
                    setLookupName(e.target.value);
                    if (lookupFeedback) setLookupFeedback(null);
                  }}
                  placeholder="Seu nome completo cadastrado"
                  className="w-full bg-[#0E1A33]/90 border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none transition-all shadow-inner font-body"
                />
              </div>
            </div>

            {/* Campo 2: Telefone com DDD Otimizado */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-chakra font-bold text-[#8E9BAE] uppercase tracking-wider">
                  Número de Telefone com DDD:
                </label>
                <span className="text-[10px] font-mono text-[#FFC20E]/90 font-bold">
                  Padrão com DDD
                </span>
              </div>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-[#FFC20E] absolute left-3.5 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  value={lookupPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneBR(e.target.value);
                    setLookupPhone(formatted);
                    if (lookupFeedback) setLookupFeedback(null);
                  }}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-[#0E1A33]/90 border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none transition-all shadow-inner font-mono tracking-wide"
                />
              </div>
              <span className="text-[10.5px] text-[#8E9BAE] mt-1.5 block">
                Padrão nacional com DDD: (00) 00000-0000 ou (00) 0000-0000
              </span>
            </div>

            {/* Botão de Localizar Chamados */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full btn-yellow !py-3 !px-4 text-xs sm:text-sm font-chakra font-bold rounded-[10px] shadow-[0_0_16px_rgba(255,194,14,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Search className="w-4 h-4" />
                <span>Localizar Meus Chamados</span>
              </button>
            </div>
          </form>

          {/* Resultados da busca (aparecem dinamicamente sob o card após o cliente pesquisar) */}
          {hasSearched && (
            <div className="pt-4 border-t border-[#1E335C]/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8E9BAE]">
                  Chamados encontrados: <strong className="text-white font-chakra">{userFoundRequests.length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHasSearched(false);
                    setLookupName('');
                    setLookupPhone('');
                    setLookupFeedback(null);
                  }}
                  className="text-[11px] text-[#FFC20E] hover:underline cursor-pointer"
                >
                  Limpar consulta
                </button>
              </div>

              {userFoundRequests.length === 0 ? (
                <div className="p-4 rounded-[12px] bg-[#0E1A33]/70 border border-[#1E335C] text-center space-y-1">
                  <p className="text-xs text-white font-chakra font-bold">
                    Nenhum chamado localizado
                  </p>
                  <p className="text-[11px] text-[#8E9BAE]">
                    Não foram localizados chamados para o nome ou telefone informado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {userFoundRequests.map(req => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-[12px] bg-[#0E1A33]/90 border border-[#1E335C] hover:border-[#FFC20E]/50 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-chakra font-bold text-[#FFC20E] text-[11px]">{req.code}</span>
                          <StatusBadge status={req.status} size="sm" />
                        </div>
                        <h4 className="font-chakra font-bold text-white text-xs sm:text-sm truncate">
                          {req.serviceType}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#8E9BAE] truncate">
                          <MapPin className="w-3 h-3 text-[#FFC20E] shrink-0" />
                          <span className="truncate">{req.address}</span>
                        </div>
                        {!req.isImmediate && req.scheduledDateTime && (
                          <div className="flex items-center gap-1.5 text-[10.5px] text-[#FFC20E] font-mono">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {new Date(req.scheduledDateTime).toLocaleDateString('pt-BR')} às {new Date(req.scheduledDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestId(req.id)}
                        className="btn-yellow !py-1.5 !px-3 text-xs font-chakra font-bold shrink-0 flex items-center gap-1"
                      >
                        <span>Ver</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. TELA DE NOVA SOLICITAÇÃO (Manual sob demanda)
  // ---------------------------------------------------------------------------
  if (activeTab === 'nova_solicitacao') {
    return (
      <div className="relative max-w-xl mx-auto px-3 sm:px-4 py-1.5 sm:py-3 animate-in fade-in duration-200">
        <div className="relative bg-gradient-to-b from-[#0A1428]/95 via-[#0D1B36]/90 to-[#060D1B]/95 border border-[#1E335C]/80 rounded-[14px] p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#FFC20E]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#16264A]/50 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-tactical-grid opacity-10 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between pb-2 border-b border-[#16264A]/80">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="w-7 h-7 rounded-full bg-[#11203D] hover:bg-[#16264A] text-[#C3CBDA] hover:text-white border border-[#1E335C] flex items-center justify-center transition-colors cursor-pointer"
                title="Voltar ao Início"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <div>
                <span className="eyebrow text-[#FFC20E] text-[9px] tracking-wider block leading-none font-display">
                  TRANSEG TÁTICO
                </span>
                <h2 className="font-display font-bold text-base sm:text-lg text-white leading-tight mt-0.5">
                  Nova Solicitação
                </h2>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFC20E]/10 text-[#FFC20E] border border-[#FFC20E]/20">
              Sob Demanda
            </span>
          </div>

          {formError && (
            <div className="relative z-10 p-2.5 bg-red-950/50 border border-red-500/50 rounded-[8px] text-[11px] text-red-200 font-medium backdrop-blur-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="relative z-10 p-2.5 bg-emerald-950/50 border border-emerald-500/50 rounded-[8px] text-[11px] text-emerald-200 font-medium backdrop-blur-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateRequest} className="relative z-10 space-y-2.5 sm:space-y-3 text-xs font-body">
            <div>
              <label className="block text-[11px] font-semibold text-white uppercase tracking-wider mb-1 font-display">
                Tipo de Serviço:
              </label>
              <FullscreenSelectTrigger
                label={serviceType}
                value={serviceType}
                onClick={() => setShowServiceTypeModal(true)}
                icon={<Shield className="w-4 h-4 text-[#FFC20E]" />}
                badge="Catálogo Tático"
                theme="dark"
                className="bg-gradient-to-r from-[#0E1A33]/90 to-[#11203D]/90 border border-[#1E335C] hover:border-[#FFC20E]/60 text-white shadow-sm backdrop-blur-md rounded-[8px] !py-2 !px-3"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white uppercase tracking-wider mb-1 font-display">
                Local da Operação:
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-3.5 h-3.5 text-[#FFC20E] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Dante Michelini, Vitória/ES ou ponto de encontro"
                  className="w-full bg-[#0E1A33]/80 hover:bg-[#11203D] border border-[#1E335C] focus:border-[#FFC20E] focus:ring-1 focus:ring-[#FFC20E]/40 rounded-[8px] pl-9 pr-3 py-2 text-xs text-white placeholder-[#8E9BAE] focus:outline-none backdrop-blur-md transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white uppercase tracking-wider mb-1 font-display">
                Modalidade:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsImmediate(true)}
                  className={`py-2 px-2.5 rounded-[8px] border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-md ${
                    isImmediate
                      ? 'bg-gradient-to-r from-[#FFC20E] to-[#E5A800] text-[#060D1B] font-bold border-[#FFC20E] shadow-[0_0_12px_rgba(255,194,14,0.35)]'
                      : 'bg-[#0E1A33]/70 hover:bg-[#11203D] text-[#8E9BAE] hover:text-white border-[#1E335C]'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${isImmediate ? 'text-[#060D1B]' : 'text-[#FFC20E]'}`} />
                  <span>Imediato (Agora)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsImmediate(false);
                    if (!scheduledDateTime) {
                      setShowScheduleModal(true);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-[8px] border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 backdrop-blur-md ${
                    !isImmediate
                      ? 'bg-gradient-to-r from-[#FFC20E] to-[#E5A800] text-[#060D1B] font-bold border-[#FFC20E] shadow-[0_0_12px_rgba(255,194,14,0.35)]'
                      : 'bg-[#0E1A33]/70 hover:bg-[#11203D] text-[#8E9BAE] hover:text-white border-[#1E335C]'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 ${!isImmediate ? 'text-[#060D1B]' : 'text-[#FFC20E]'}`} />
                  <span>Horário Hoje</span>
                </button>
              </div>

              {!isImmediate && scheduledDateTime && (
                <div className="mt-2 p-2 bg-[#0E1A33]/90 border border-[#1E335C] rounded-[8px] flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FFC20E]" />
                    <span>{new Date(scheduledDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (Hoje)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className="text-[#FFC20E] text-[11px] underline cursor-pointer"
                  >
                    Alterar
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white uppercase tracking-wider mb-1 font-display">
                Observações Operacionais:
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={2}
                placeholder="Ex: Ponto de referência, vestimenta ou detalhes do translado"
                className="w-full bg-[#0E1A33]/80 hover:bg-[#11203D] border border-[#1E335C] focus:border-[#FFC20E] focus:ring-1 focus:ring-[#FFC20E]/40 rounded-[8px] p-2.5 text-xs text-white placeholder-[#8E9BAE] focus:outline-none backdrop-blur-md transition-all shadow-inner resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#16264A]/80">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="w-1/3 btn-ghost-dark !border !border-[#1E335C] hover:!border-[#8E9BAE] !py-2 !px-3 text-xs font-semibold text-[#C3CBDA] hover:text-white rounded-[8px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-2/3 btn-yellow !py-2 !px-3 text-xs font-bold rounded-[8px] shadow-[0_0_16px_rgba(255,194,14,0.3)] flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Confirmar e Chamar</span>
              </button>
            </div>
          </form>
        </div>

        <FullscreenSelectModal
          isOpen={showServiceTypeModal}
          onClose={() => setShowServiceTypeModal(false)}
          title="TIPO DE SERVIÇO"
          subtitle="Selecione a modalidade de segurança operacional desejada para esta solicitação."
          eyebrow="TRANSEG OPERACIONAL · CATÁLOGO TÁTICO"
          options={serviceOptions}
          selectedValue={serviceType}
          onSelect={(val) => setServiceType(val as ServiceType)}
          searchable={false}
        />

        <TacticalScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          value={scheduledDateTime}
          onConfirm={(val, isImm) => {
            if (isImm) {
              setIsImmediate(true);
              setScheduledDateTime('');
            } else {
              setScheduledDateTime(val);
              setIsImmediate(false);
            }
          }}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. TELA INICIAL: CARDS DOS SERVIÇOS & BARRA FLUTUANTE (Screenshot_20261013-181158)
  // ---------------------------------------------------------------------------
  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-36 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* HERO BANNER OFICIAL TRANSEG */}
      <div className="text-left pt-1">
        <h1 
          className="font-chakra font-bold sm:font-extrabold text-[28px] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.12] sm:leading-[1.10] tracking-tight select-none"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          <span className="text-white block drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Segurança para você ou
          </span>
          <span className="text-white block drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            para o seu patrimônio,
          </span>
          <span 
            className="block w-fit bg-gradient-to-r from-[#FFE8A0] via-[#FFC20E] to-[#E58500] bg-clip-text text-transparent filter drop-shadow-[0_2px_14px_rgba(255,194,14,0.3)] pb-1"
          >
            na palma da sua mão.
          </span>
        </h1>
      </div>



      {/* BANNER RÁPIDO PARA CONSULTA DE AGENDA & CHAMADOS COM NOME E TELEFONE */}
      <div className="p-5 sm:p-6 rounded-[20px] bg-gradient-to-br from-[#0A1428] to-[#060D1B] border border-[#1E335C] shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#FFC20E]/10 border border-[#FFC20E]/30 flex items-center justify-center text-[#FFC20E]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-chakra font-bold text-white uppercase tracking-wider">
              Consultar Meus Chamados e Agendamento
            </h3>
            <p className="text-xs text-[#8E9BAE]">
              Consulte e acompanhe seus chamados informando seu nome e telefone com DDD.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className="w-full py-3 bg-[#FFC20E] text-[#060D1B] rounded-[12px] text-sm font-chakra font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#E5AC0D] transition-colors"
        >
          <span>Acessar Consulta</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* =========================================================================
          FILTROS DE CATEGORIA (Pills no topo conforme Screenshot_20261013-181158)
         ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="eyebrow text-[#FFC20E] text-[10px] tracking-wider block font-chakra">
              TRANSEG OPERACIONAL
            </span>
            <h2 className="font-chakra font-bold text-xl sm:text-2xl text-white uppercase tracking-wider">
              Serviços Cadastrados
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#8E9BAE] hidden sm:inline">
            Selecione o serviço e a quantidade de horas desejada
          </span>
        </div>

        {/* Categoria Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {serviceCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-chakra font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFC20E] text-[#060D1B] shadow-[0_0_14px_rgba(255,194,14,0.35)]'
                    : 'bg-[#0E1A33]/80 hover:bg-[#122345] text-[#C3CBDA] hover:text-white border border-[#1E335C]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          GRID DE CARDS DE SERVIÇOS (Fiel à imagem de referência Screenshot_20261013-181158)
          - Imagem com Tag top-left + Checkmark top-right + Duração bottom-right
          - Título e Descrição
          - Complementos & Seleção de Horas
          - Preço: A PARTIR DE / TOTAL
          - Botão: SELECIONAR / ✓ SELECIONADO
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {filteredServices.map((service) => {
          const isSelected = selectedServices.some(s => s.serviceId === service.id);
          const currentHours = getCardHours(service);
          const currentComplements = serviceComplementsMap[service.id] || [];
          const calculatedPrice = calculateServicePrice(service, currentHours, currentComplements);

          return (
            <div
              key={service.id}
              className={`group rounded-[16px] overflow-hidden border transition-all duration-200 flex flex-col justify-between backdrop-blur-xl ${
                isSelected
                  ? 'bg-gradient-to-b from-[#0F1E3D] via-[#0A162E] to-[#060D1B] border-[#FFC20E] shadow-[0_0_30px_rgba(255,194,14,0.25)]'
                  : 'bg-gradient-to-b from-[#0A1428]/95 via-[#0A1428]/90 to-[#060D1B]/95 border-[#1E335C]/80 hover:border-[#FFC20E]/50 shadow-[0_8px_25px_rgba(0,0,0,0.5)]'
              }`}
            >
              {/* Topo: Imagem com Badges e Tag conforme Screenshot */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-[#060D1B]">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Gradiente escuro para legibilidade */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060D1B] via-transparent to-black/60 pointer-events-none" />

                {/* Badge Tag Superior Esquerda (ex: ESMALTAÇÃO EM GEL -> ESCOLTA VIP) */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-[6px] bg-black/75 backdrop-blur-md text-white font-chakra font-bold text-[10px] tracking-wider uppercase border border-white/20 shadow">
                    {service.tag || service.category}
                  </span>
                </div>

                {/* Checkmark Superior Direita (indicador ativo/inativo) */}
                <div 
                  onClick={() => handleToggleSelectService(service)}
                  className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FFC20E] text-[#060D1B] shadow-[0_0_12px_rgba(255,194,14,0.6)]'
                      : 'bg-black/50 hover:bg-black/80 text-white/40 border border-white/30 backdrop-blur-md'
                  }`}
                  title={isSelected ? 'Serviço Selecionado' : 'Clique para Selecionar'}
                >
                  <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                </div>

                {/* Badge de Horas Inferior Direita da Imagem (ex: ⏱ 1h 30min -> ⏱ 4h) */}
                <div className="absolute bottom-3 right-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#FFC20E] font-chakra font-bold text-[11px] tracking-wide border border-[#FFC20E]/40 flex items-center gap-1 shadow">
                    <Clock className="w-3 h-3 text-[#FFC20E]" />
                    <span>{currentHours}h</span>
                  </span>
                </div>
              </div>

              {/* Corpo do Card */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Título & Descrição */}
                <div>
                  <h3 className="font-chakra font-bold text-white text-lg sm:text-xl tracking-wide group-hover:text-[#FFC20E] transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#C3CBDA] mt-1 line-clamp-2 leading-relaxed font-body">
                    {service.description}
                  </p>
                </div>

                {/* SELETOR DE QUANTIDADE DE HORAS */}
                <div className="space-y-1.5 pt-1 border-t border-[#16264A]/60">
                  <div className="flex items-center justify-between text-[11px] font-chakra uppercase font-bold text-[#8E9BAE]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FFC20E]" />
                      <span>Duração em Horas:</span>
                    </span>
                    <span className="text-[#FFC20E] font-mono">{currentHours} horas</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {(service.availableHours && service.availableHours.length > 0 
                      ? service.availableHours 
                      : [2, 4, 8, 12]).map((hrs) => {
                      const isHourActive = currentHours === hrs;
                      return (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => handleChangeHours(service.id, hrs)}
                          className={`py-1.5 rounded-[6px] text-xs font-chakra font-bold uppercase transition-all cursor-pointer ${
                            isHourActive
                              ? 'bg-[#FFC20E] text-[#060D1B] shadow-[0_0_10px_rgba(255,194,14,0.3)]'
                              : 'bg-[#0E1A33] hover:bg-[#16264A] text-[#C3CBDA] border border-[#1E335C]'
                          }`}
                        >
                          {hrs}h
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COMPLEMENTOS CONFORME A IMAGEM */}
                {service.complements && service.complements.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-[#16264A]/60">
                    <div className="flex items-center justify-between text-[11px] font-chakra uppercase font-bold">
                      <span className="flex items-center gap-1 text-[#FFC20E]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>COMPLEMENTOS</span>
                      </span>
                      <span className="text-[10px] text-[#8E9BAE] font-mono">
                        {service.complements.length} opções
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {service.complements.map((comp) => {
                        const isCompChecked = currentComplements.includes(comp.id);
                        return (
                          <label
                            key={comp.id}
                            className={`flex items-center justify-between p-2 rounded-[8px] border transition-all cursor-pointer text-xs ${
                              isCompChecked
                                ? 'bg-[#FFC20E]/10 border-[#FFC20E]/60 text-white'
                                : 'bg-[#0E1A33]/60 hover:bg-[#122345] border-[#1E335C]/60 text-[#C3CBDA]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isCompChecked}
                                onChange={() => handleToggleComplement(service.id, comp.id)}
                                className="w-3.5 h-3.5 rounded accent-[#FFC20E] cursor-pointer"
                              />
                              <span className="truncate text-[11px] font-body">{comp.name}</span>
                            </div>
                            <span className="font-mono text-[#FFC20E] text-[11px] font-bold shrink-0">
                              +R$ {comp.price.toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PREÇO E BOTÃO SELECIONAR */}
                <div className="pt-2 border-t border-[#16264A]/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-chakra font-bold uppercase tracking-wider text-[#8E9BAE]">
                      {currentHours > service.defaultHours || currentComplements.length > 0 ? 'VALOR CALCULADO' : 'A PARTIR DE'}
                    </span>
                    <span className="text-xl sm:text-2xl font-chakra font-bold text-white tracking-wide">
                      R$ {calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSelectService(service)}
                    className={`w-full py-2.5 px-4 rounded-[10px] text-xs font-chakra font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-[#FFC20E] text-[#060D1B] shadow-[0_0_18px_rgba(255,194,14,0.4)]'
                        : 'bg-[#0E1A33] hover:bg-[#16264A] text-white border border-[#1E335C] hover:border-[#FFC20E]/50'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>✓ SELECIONADO</span>
                      </>
                    ) : (
                      <span>SELECIONAR</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          BARRA FLUTUANTE E FIXA NA PARTE INFERIOR (Fiel à imagem de referência)
          - Aparece SOMENTE na tela inicial (activeTab === 'inicio') e quando o modal de agendamento NÃO está aberto
         ========================================================================= */}
      {selectedServices.length > 0 && activeTab === 'inicio' && !showBookingModal && !isBookingModalOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-6 duration-300">
          <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-3 sm:pb-4">
            <div className="rounded-[18px] bg-gradient-to-b from-[#0A1428]/95 via-[#071124]/95 to-[#040914]/95 border-2 border-[#1E3A6D] shadow-[0_-12px_45px_rgba(0,0,0,0.85)] p-3.5 sm:p-4 text-white backdrop-blur-2xl space-y-2.5">
              
              {/* Linha 1: Contagem e Limpar Seleção */}
              <div className="flex items-center justify-between text-xs font-chakra border-b border-[#16264A]/80 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#FFC20E] tracking-wider uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FFC20E]" />
                    <span>
                      {selectedServices.length} {selectedServices.length === 1 ? 'SERVIÇO SELECIONADO' : 'SERVIÇOS SELECIONADOS'}
                    </span>
                  </span>
                  {totalComplementsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FFC20E]/20 border border-[#FFC20E]/50 text-[#FFC20E] text-[10px] sm:text-[10.5px] font-mono font-bold flex items-center gap-1">
                      <span>• {totalComplementsCount} {totalComplementsCount === 1 ? 'COMPLEMENTO INCLUSO' : 'COMPLEMENTOS INCLUSOS'}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-[#8E9BAE] hover:text-white underline cursor-pointer font-medium"
                >
                  Limpar seleção
                </button>
              </div>

              {/* Linha 2: Chips dos Serviços Selecionados & Serviços Complementares */}
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto scrollbar-none py-0.5">
                {selectedServices.map((item) => {
                  const srv = adminServices.find(s => s.id === item.serviceId);
                  const activeComps = (srv?.complements || []).filter(c => item.complements.includes(c.id));
                  return (
                    <div
                      key={item.serviceId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#11203D] border border-[#1E335C] text-xs font-chakra text-white shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-white tracking-wide truncate">
                          {srv?.name || 'Serviço'}
                        </span>
                        <span className="px-2 py-0.5 rounded-[6px] bg-[#0E1A33] border border-[#1E335C] text-[10px] font-mono text-[#FFC20E] font-bold shrink-0">
                          {item.hours}h
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedService(item.serviceId)}
                          className="w-4 h-4 rounded-full bg-white/10 hover:bg-[#DC2626] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
                          title="Remover este serviço"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Serviços Complementares Vinculados a este Serviço */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeComps.length > 0 ? (
                          <>
                            <span className="text-[10px] uppercase text-[#8E9BAE] font-bold tracking-wider">
                              Complementares:
                            </span>
                            {activeComps.map(comp => (
                              <span
                                key={comp.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFC20E]/15 border border-[#FFC20E]/40 text-[#FFC20E] text-[10.5px] font-mono font-medium shadow-sm"
                              >
                                <span>{comp.name} (+R$ {comp.price.toFixed(2)})</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleComplement(item.serviceId, comp.id)}
                                  className="w-3.5 h-3.5 rounded-full hover:bg-[#DC2626] hover:text-white text-[#FFC20E] flex items-center justify-center transition-colors cursor-pointer"
                                  title={`Remover complemento ${comp.name}`}
                                >
                                  <X className="w-2 h-2" />
                                </button>
                              </span>
                            ))}
                          </>
                        ) : (
                          <span className="text-[10px] text-[#8E9BAE]/70 font-mono italic">
                            Sem serviços complementares selecionados
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Linha 3: Tempo, Complementos, Total e Botão AGENDAR */}
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#16264A]/60">
                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                  {/* Tempo Total */}
                  <div className="flex items-center gap-1.5 text-xs text-[#C3CBDA] font-chakra font-medium">
                    <Clock className="w-4 h-4 text-[#FFC20E]" />
                    <span>Tempo: <strong className="text-white font-mono">{totalSelectedHours}h</strong></span>
                  </div>

                  {/* Total de Complementares */}
                  {totalComplementsCount > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#C3CBDA] font-chakra font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFC20E]" />
                      <span>Complementos: <strong className="text-[#FFC20E] font-mono">{totalComplementsCount}</strong></span>
                    </div>
                  )}

                  {/* Preço Total */}
                  <div className="text-sm sm:text-base font-chakra">
                    <span className="text-[#8E9BAE] text-xs">Total: </span>
                    <strong className="text-white sm:text-lg font-bold">
                      R$ {totalSelectedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                {/* Botão de Ação: AGENDAR → */}
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(true);
                    setIsBookingModalOpen(true);
                  }}
                  className="btn-yellow !py-2.5 !px-5 text-xs sm:text-sm font-chakra font-bold uppercase tracking-wider rounded-[10px] shadow-[0_0_20px_rgba(255,194,14,0.4)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <span>AGENDAR</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}




    </div>
  );
};
