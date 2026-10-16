import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Calendar as CalendarIcon, 
  Headset, 
  MapPin, 
  Phone, 
  User, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  LocateFixed, 
  AlertTriangle,
  Minus,
  Plus,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { AdminServiceItem } from '../../../types';
import { formatPhoneBR } from '../../../utils/phone';
import { useBackHandler } from '../../../hooks/useBackHandler';
import { useNavigationHistory } from '../../../context/NavigationHistoryContext';

interface BookingStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServices: Array<{ serviceId: string; hours: number; complements: string[] }>;
  adminServices: AdminServiceItem[];
  totalSelectedHours: number;
  totalSelectedPrice: number;
  initialClientName?: string;
  initialClientPhone?: string;
  onChangeHours?: (serviceId: string, hours: number) => void;
  onToggleComplement?: (serviceId: string, compId: string) => void;
  onConfirm: (data: {
    bookingName: string;
    bookingPhone: string;
    bookingAddress: string;
    bookingDateTime: string;
    bookingObservations: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    selectedDateStr: string;
    isImmediate: boolean;
  }) => { success: boolean; request?: any; message?: string } | void;
  onViewSchedule?: () => void;
  calculateServicePrice: (service: AdminServiceItem, hours: number, compIds: string[]) => number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES_FULL = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const WEEKDAY_HEADERS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Horários organizados por turnos
const TIME_SLOTS_MORNING = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const TIME_SLOTS_AFTERNOON = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const TIME_SLOTS_NIGHT = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

export const BookingStepperModal: React.FC<BookingStepperModalProps> = ({
  isOpen,
  onClose,
  selectedServices,
  adminServices,
  totalSelectedHours,
  totalSelectedPrice,
  initialClientName = '',
  initialClientPhone = '',
  onChangeHours,
  onToggleComplement,
  onConfirm,
  onViewSchedule,
  calculateServicePrice
}) => {
  // Passos de 1 a 5:
  // 1: Serviço (Resumo & Detalhes)
  // 2: Data (Calendário Mensal)
  // 3: Horário (Grade de Horários & Turnos)
  // 4: Dados (Nome, WhatsApp, Endereço, Observações)
  // 5: Confirmação (Resumo Final & Aceite)
  const [step, setStep] = useState<number>(1);

  // Estados do Agendamento
  const now = useMemo(() => new Date(), []);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<number>(now.getMonth());
  const [currentCalendarYear, setCurrentCalendarYear] = useState<number>(now.getFullYear());

  // Ajuste de horas de serviço no Passo 1
  const handleStep1ChangeHours = (serviceId: string, hours: number) => {
    const validHours = Math.max(1, Math.min(72, hours));
    if (onChangeHours) {
      onChangeHours(serviceId, validHours);
    }
  };

  // Toggle de serviços complementares no Passo 1
  const handleStep1ToggleComplement = (serviceId: string, compId: string) => {
    if (onToggleComplement) {
      onToggleComplement(serviceId, compId);
    }
  };

  // Contagem de complementos selecionados
  const totalStep1Complements = useMemo(() => {
    return selectedServices.reduce((sum, item) => sum + (item.complements?.length || 0), 0);
  }, [selectedServices]);

  // Cálculo financeiro dos complementos para o resumo da confirmação
  const complementsTotal = useMemo(() => {
    return selectedServices.reduce((sum, item) => {
      const srv = adminServices.find(as => as.id === item.serviceId);
      if (!srv?.complements) return sum;
      const comps = srv.complements.filter(c => item.complements.includes(c.id));
      return sum + comps.reduce((cSum, c) => cSum + c.price, 0);
    }, 0);
  }, [selectedServices, adminServices]);

  const baseAndHoursTotal = Math.max(0, totalSelectedPrice - complementsTotal);

  // Cards dos Meses disponíveis para seleção rápida
  const availableMonthCards = useMemo(() => {
    const list = [];
    const currentM = now.getMonth();
    const currentY = now.getFullYear();
    for (let i = 0; i < 4; i++) {
      const d = new Date(currentY, currentM + i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      list.push({
        monthIndex: mIdx,
        year: yr,
        label: MONTH_NAMES[mIdx],
        shortLabel: MONTH_NAMES[mIdx].slice(0, 3).toUpperCase(),
      });
    }
    return list;
  }, [now]);
  
  // Data Selecionada (default: amanhã)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Horário Selecionado (ex: "10:00")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00');
  const [timeFilter, setTimeFilter] = useState<'todos' | 'manha' | 'tarde' | 'noite'>('todos');

  // Dados do Cliente & Endereço
  const [clientName, setClientName] = useState(initialClientName);
  const [clientPhone, setClientPhone] = useState(initialClientPhone);
  const [address, setAddress] = useState('');
  const [observations, setObservations] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Validação e Erro
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdProtocol, setCreatedProtocol] = useState<string>('');

  // Lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Atualizar quando props mudam
  useEffect(() => {
    if (initialClientName && !clientName) setClientName(initialClientName);
    if (initialClientPhone && !clientPhone) setClientPhone(initialClientPhone);
  }, [initialClientName, initialClientPhone]);

  const { triggerBack, dismissGroup } = useNavigationHistory();

  // Fecha o fluxo completo e limpa as entradas de histórico associadas
  const handleCloseAll = useCallback(() => {
    dismissGroup('booking-stepper');
    onClose();
  }, [dismissGroup, onClose]);

  // Passo 1 / Abertura do Modal -> Botão nativo fecha o modal e volta ao Início
  useBackHandler({
    id: 'booking-stepper-open',
    groupId: 'booking-stepper',
    active: isOpen,
    onBack: () => {
      onClose();
    }
  });

  // Passo 2 -> Botão nativo volta para o Passo 1
  useBackHandler({
    id: 'booking-stepper-step-2',
    groupId: 'booking-stepper',
    active: isOpen && step >= 2 && !isSuccess,
    onBack: () => {
      setStep(1);
    }
  });

  // Passo 3 -> Botão nativo volta para o Passo 2
  useBackHandler({
    id: 'booking-stepper-step-3',
    groupId: 'booking-stepper',
    active: isOpen && step >= 3 && !isSuccess,
    onBack: () => {
      setStep(2);
    }
  });

  // Passo 4 -> Botão nativo volta para o Passo 3
  useBackHandler({
    id: 'booking-stepper-step-4',
    groupId: 'booking-stepper',
    active: isOpen && step >= 4 && !isSuccess,
    onBack: () => {
      setStep(3);
    }
  });

  // Passo 5 -> Botão nativo volta para o Passo 4
  useBackHandler({
    id: 'booking-stepper-step-5',
    groupId: 'booking-stepper',
    active: isOpen && step >= 5 && !isSuccess,
    onBack: () => {
      setStep(4);
    }
  });

  // Tela de Sucesso -> Botão nativo fecha o modal e volta ao Início
  useBackHandler({
    id: 'booking-stepper-success',
    groupId: 'booking-stepper',
    active: isOpen && isSuccess,
    onBack: () => {
      onClose();
    }
  });

  if (!isOpen) return null;

  // Lista dos 5 passos do stepper
  const STEPS_CONFIG = [
    { id: 1, label: 'Serviço' },
    { id: 2, label: 'Data' },
    { id: 3, label: 'Horário' },
    { id: 4, label: 'Dados' },
    { id: 5, label: 'Confirmação' },
  ];

  // Cálculo de Horário Término Baseado no Início e Duração
  const { startTimeStr, endTimeStr } = useMemo(() => {
    if (!selectedTimeSlot) return { startTimeStr: '--:--', endTimeStr: '--:--' };
    const [h, m] = selectedTimeSlot.split(':').map(Number);
    const startMinutes = (h || 0) * 60 + (m || 0);
    const durationMinutes = Math.max(1, totalSelectedHours) * 60;
    const endMinutes = startMinutes + durationMinutes;
    
    const endH = Math.floor(endMinutes / 60) % 24;
    const endM = endMinutes % 60;
    const extraDays = Math.floor(endMinutes / (24 * 60));
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeFormatted = `${pad(endH)}:${pad(endM)}`;
    const daysSuffix = extraDays > 0 ? ` (+${extraDays}d)` : '';

    return {
      startTimeStr: selectedTimeSlot,
      endTimeStr: `${timeFormatted}${daysSuffix}`
    };
  }, [selectedTimeSlot, totalSelectedHours]);

  // Formatação de data em extenso
  const formatSelectedDateFull = (d: Date) => {
    const weekday = WEEKDAY_NAMES_FULL[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${weekday}, ${day} de ${month} de ${year}`;
  };

  const padZero = (n: number) => String(n).padStart(2, '0');

  // ISO string para agendamento
  const combinedIsoDateTime = useMemo(() => {
    if (!selectedDate || !selectedTimeSlot) return '';
    const [h, m] = selectedTimeSlot.split(':').map(Number);
    const y = selectedDate.getFullYear();
    const mon = padZero(selectedDate.getMonth() + 1);
    const day = padZero(selectedDate.getDate());
    return `${y}-${mon}-${day}T${padZero(h)}:${padZero(m)}`;
  }, [selectedDate, selectedTimeSlot]);

  // Geração da grade de dias para o mês atual
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Array<{
      date: Date | null;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Células vazias antes do dia 1
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        date: null,
        dayNumber: 0,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isSelected: false
      });
    }

    // Dias do mês
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(currentCalendarYear, currentCalendarMonth, dayNum);
      d.setHours(0, 0, 0, 0);
      const isPast = d < today;
      const isToday = d.getTime() === today.getTime();
      const isSelected = selectedDate ? (d.toDateString() === selectedDate.toDateString()) : false;

      days.push({
        date: d,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isPast,
        isToday,
        isSelected
      });
    }

    return days;
  }, [currentCalendarMonth, currentCalendarYear, selectedDate]);

  // Navegação de Mês
  const handlePrevMonth = () => {
    const isCurrentOrPastMonth = 
      currentCalendarYear === now.getFullYear() && 
      currentCalendarMonth <= now.getMonth();
    if (isCurrentOrPastMonth) return;

    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(prev => prev - 1);
    } else {
      setCurrentCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(prev => prev + 1);
    } else {
      setCurrentCalendarMonth(prev => prev + 1);
    }
  };

  // Filtragem de horários por turno
  const filteredTimeSlots = useMemo(() => {
    const isToday = selectedDate && selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let all: string[] = [];
    if (timeFilter === 'manha') all = TIME_SLOTS_MORNING;
    else if (timeFilter === 'tarde') all = TIME_SLOTS_AFTERNOON;
    else if (timeFilter === 'noite') all = TIME_SLOTS_NIGHT;
    else all = [...TIME_SLOTS_MORNING, ...TIME_SLOTS_AFTERNOON, ...TIME_SLOTS_NIGHT];

    return all.filter(slot => {
      if (isToday) {
        const [h, m] = slot.split(':').map(Number);
        if (h < currentHour || (h === currentHour && m <= currentMin)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedDate, timeFilter, now]);

  // Preencher endereço completo via GPS (rua, número, cidade, estado e CEP)
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setValidationError('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setIsLocating(true);
    setValidationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          // 1. Tenta OpenStreetMap Nominatim com detalhes em português
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);
          
          let resolvedAddress = '';

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
                signal: controller.signal
              }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              if (data && data.address) {
                const addr = data.address;
                const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.avenue || '';
                const number = addr.house_number || '';
                const suburb = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || '';
                const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
                const state = addr.state || addr.state_district || '';
                
                let cep = addr.postcode ? addr.postcode.replace(/\D/g, '') : '';
                if (cep.length === 8) {
                  cep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
                } else if (addr.postcode) {
                  cep = addr.postcode;
                }

                const parts: string[] = [];
                if (road) {
                  parts.push(number ? `${road}, ${number}` : road);
                }
                if (suburb && suburb !== road) {
                  parts.push(suburb);
                }
                if (city) {
                  parts.push(state ? `${city} - ${state}` : city);
                }
                if (cep) {
                  parts.push(`CEP: ${cep}`);
                }

                if (parts.length > 0) {
                  resolvedAddress = parts.join(', ');
                } else if (data.display_name) {
                  resolvedAddress = data.display_name;
                }
              }
            }
          } catch {
            // Segue para fallback se Nominatim demorar ou falhar
          }

          // 2. Fallback caso Nominatim não tenha retornado rua/cidade/cep
          if (!resolvedAddress) {
            try {
              const bdcController = new AbortController();
              const bdcTimeout = setTimeout(() => bdcController.abort(), 6000);
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
                { signal: bdcController.signal }
              );
              clearTimeout(bdcTimeout);

              if (bdcRes.ok) {
                const bdcData = await bdcRes.json();
                const street = bdcData.localityInfo?.administrative?.[4]?.name || bdcData.localityInfo?.informative?.[0]?.name || '';
                const suburb = bdcData.localityInfo?.administrative?.[3]?.name || '';
                const city = bdcData.city || bdcData.locality || '';
                const state = bdcData.principalSubdivisionCode?.replace('BR-', '') || bdcData.principalSubdivision || '';
                const cep = bdcData.postcode || '';

                const parts: string[] = [];
                if (street) parts.push(street);
                if (suburb && suburb !== street) parts.push(suburb);
                if (city) parts.push(state ? `${city} - ${state}` : city);
                if (cep) parts.push(`CEP: ${cep}`);

                if (parts.length > 0) {
                  resolvedAddress = parts.join(', ');
                }
              }
            } catch {
              // ignore
            }
          }

          // Se conseguiu o endereço estruturado completo:
          if (resolvedAddress) {
            setAddress(resolvedAddress);
          } else {
            setAddress(`Localização via GPS: (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
          }
        } catch {
          setAddress(`Localização via GPS: (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setValidationError('Permissão de GPS negada. Por favor, digite o endereço manualmente ou autorize o GPS.');
        } else {
          setValidationError('Não foi possível obter sua localização. Digite o endereço manualmente.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Navegação para o próximo passo com validações
  const handleNextStep = () => {
    setValidationError(null);

    // Validação Passo 1
    if (step === 1) {
      if (selectedServices.length === 0) {
        setValidationError('Selecione ao menos um serviço no catálogo para prosseguir.');
        return;
      }
      setStep(2);
      return;
    }

    // Validação Passo 2 (Data)
    if (step === 2) {
      if (!selectedDate) {
        setValidationError('Por favor, selecione uma data no calendário.');
        return;
      }
      setStep(3);
      return;
    }

    // Validação Passo 3 (Horário)
    if (step === 3) {
      if (!selectedTimeSlot) {
        setValidationError('Por favor, selecione um horário para a operação.');
        return;
      }
      setStep(4);
      return;
    }

    // Validação Passo 4 (Dados e Endereço)
    if (step === 4) {
      if (!clientName.trim() || clientName.trim().length < 3) {
        setValidationError('Informe seu Nome Completo para validar a operação.');
        return;
      }
      const digits = clientPhone.replace(/\D/g, '');
      if (digits.length < 10) {
        setValidationError('Informe um WhatsApp / Telefone válido com DDD no padrão (00) 00000-0000.');
        return;
      }
      if (!address.trim() || address.trim().length < 4) {
        setValidationError('Informe o endereço ou ponto de referência da operação.');
        return;
      }
      setStep(5);
      return;
    }

    // Validação Passo 5 (Confirmação Final)
    if (step === 5) {
      handleFinalSubmission();
    }
  };

  // Submissão Final
  const handleFinalSubmission = () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      onConfirm({
        bookingName: clientName.trim(),
        bookingPhone: clientPhone.trim(),
        bookingAddress: address.trim(),
        bookingDateTime: combinedIsoDateTime,
        bookingObservations: observations.trim(),
        scheduledStartTime: startTimeStr,
        scheduledEndTime: endTimeStr,
        selectedDateStr: formatSelectedDateFull(selectedDate),
        isImmediate: false
      });

      const protocolNumber = `TRG-${Math.floor(10000 + Math.random() * 90000)}`;
      setCreatedProtocol(protocolNumber);
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch {
      setIsSubmitting(false);
      setValidationError('Ocorreu um erro ao processar o agendamento. Tente novamente.');
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (isSuccess) {
      handleCloseAll();
      return;
    }
    triggerBack();
  };

  const canGoPrevMonth = !(
    currentCalendarYear === now.getFullYear() && 
    currentCalendarMonth <= now.getMonth()
  );

  return (
    <div 
      role="region"
      aria-label="Fluxo de Agendamento"
      className="relative w-full max-w-2xl mx-auto flex flex-col justify-between h-full max-h-full min-h-0 overflow-hidden text-white font-body select-none px-2.5 sm:px-4 py-1 sm:py-2 animate-in fade-in duration-200"
    >
      {/* =========================================================================
          1. BARRA DE NAVEGAÇÃO SUPERIOR DISCRETA (Com Headset Preservado)
         ========================================================================= */}
      <div className="shrink-0 flex items-center justify-between pb-1 pt-0.5">
        <button
          type="button"
          onClick={handleCloseAll}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#8E9BAE] hover:text-[#FFC20E] font-chakra font-semibold cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11203D] border border-[#1E335C] text-xs font-chakra text-[#FFC20E] shadow-sm">
          <Headset className="w-3.5 h-3.5 text-[#FFC20E]" />
          <span className="font-semibold tracking-wide">Suporte Tático</span>
        </div>
      </div>

      {/* =========================================================================
          2. STEPPER NUMERADO DE 1 A 5 (Amplo, fiel e sem rolagem)
         ========================================================================= */}
      <div className="shrink-0 py-1.5 sm:py-2 px-3 rounded-[16px] bg-[#0E1A33]/90 border border-[#1E335C] backdrop-blur-sm shadow-md">
        <div className="flex items-center justify-between relative max-w-lg mx-auto">
          {STEPS_CONFIG.map((s, index) => {
            const isPassed = s.id < step;
            const isCurrent = s.id === step;
            const isClickable = s.id < step && !isSuccess;

            return (
              <React.Fragment key={s.id}>
                {index > 0 && (
                  <div 
                    className={`flex-1 h-0.5 mx-1 sm:mx-1.5 transition-all duration-300 ${
                      s.id <= step ? 'bg-[#FFC20E]' : 'bg-[#1E335C]'
                    }`} 
                  />
                )}

                <div 
                  onClick={() => {
                    if (isClickable) setStep(s.id);
                  }}
                  className={`flex flex-col items-center gap-0.5 shrink-0 ${isClickable ? 'cursor-pointer group' : ''}`}
                >
                  <div 
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-chakra font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#FFC20E] text-[#060D1B] ring-2 ring-[#FFC20E]/40 shadow-[0_0_10px_rgba(255,194,14,0.4)] scale-105'
                        : isPassed
                        ? 'bg-[#FFC20E]/20 border border-[#FFC20E] text-[#FFC20E]'
                        : 'bg-[#0E1A33] border border-[#1E335C] text-[#8E9BAE]'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                  </div>
                  <span 
                    className={`text-[9.5px] sm:text-[10.5px] font-chakra uppercase tracking-wider transition-colors ${
                      isCurrent 
                        ? 'text-[#FFC20E] font-bold' 
                        : isPassed 
                        ? 'text-white font-medium' 
                        : 'text-[#8E9BAE]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. CORPO PRINCIPAL COM CONTEÚDO DOS PASSOS (Cards Amplos e Zero Scroll)
         ========================================================================= */}
      <main className="flex-1 min-h-0 flex flex-col justify-center py-1 sm:py-1.5 overflow-hidden">
        <div className={`w-full flex-1 flex flex-col min-h-0 overflow-hidden ${[1, 2, 3, 4, 5].includes(step) ? 'justify-between' : 'justify-center space-y-1.5 sm:space-y-2'}`}>

          {/* Banner de Mensagem de Erro / Validação */}
          {validationError && (
            <div className="p-2 sm:p-2.5 rounded-[10px] bg-red-950/80 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-2 shrink-0 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">{validationError}</span>
            </div>
          )}

          {/* -----------------------------------------------------------------------
              TELA DE SUCESSO APÓS CONFIRMAR O PASSO 5
             ----------------------------------------------------------------------- */}
          {isSuccess ? (
            <div className="flex-1 min-h-0 flex flex-col justify-center items-center py-1 space-y-2 sm:space-y-2.5 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FFC20E]/15 border-2 border-[#FFC20E] flex items-center justify-center text-[#FFC20E] mx-auto shadow-[0_0_16px_rgba(255,194,14,0.35)]">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
              </div>

              <div className="space-y-0.5 text-center">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFC20E]/10 border border-[#FFC20E]/30 text-[#FFC20E] text-[11px] font-mono font-bold uppercase tracking-wider">
                  Protocolo: {createdProtocol}
                </span>
                <h2 className="font-chakra font-extrabold text-lg sm:text-xl text-white uppercase tracking-wider">
                  Agendamento Confirmado!
                </h2>
                <p className="text-[11px] sm:text-xs text-[#C3CBDA] max-w-md mx-auto">
                  Sua solicitação operacional foi transmitida para a Central de Despacho Tático TRANSEG.
                </p>
              </div>

              {/* Card Resumo do Despacho Otimizado */}
              <div className="w-full max-w-md p-3 sm:p-3.5 rounded-[16px] bg-[#0E1A33]/95 border border-[#1E335C] text-left space-y-1.5 text-xs sm:text-sm shadow-xl">
                <div className="flex justify-between border-b border-[#1E335C]/60 pb-1">
                  <span className="text-[#8E9BAE]">Data Operacional:</span>
                  <span className="font-bold text-white">{formatSelectedDateFull(selectedDate)}</span>
                </div>
                <div className="flex justify-between border-b border-[#1E335C]/60 pb-1">
                  <span className="text-[#8E9BAE]">Horário:</span>
                  <span className="font-mono font-bold text-[#FFC20E]">{startTimeStr} às {endTimeStr}</span>
                </div>
                <div className="flex justify-between border-b border-[#1E335C]/60 pb-1">
                  <span className="text-[#8E9BAE]">Cliente:</span>
                  <span className="font-bold text-white truncate max-w-[220px]">{clientName}</span>
                </div>
                <div className="flex justify-between border-b border-[#1E335C]/60 pb-1">
                  <span className="text-[#8E9BAE]">Local:</span>
                  <span className="font-bold text-white text-right truncate max-w-[220px]">{address}</span>
                </div>
                <div className="flex justify-between pt-0.5 text-xs sm:text-base">
                  <span className="font-chakra font-bold text-white uppercase">Total Geral:</span>
                  <span className="font-mono font-extrabold text-[#FFC20E]">
                    R$ {totalSelectedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-1 max-w-sm mx-auto w-full">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseAll();
                    if (onViewSchedule) onViewSchedule();
                  }}
                  className="w-full btn-yellow !py-2.5 text-xs sm:text-sm font-chakra font-bold tracking-wider rounded-[10px] shadow-[0_0_15px_rgba(255,194,14,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>ACOMPANHAR NA MINHA AGENDA</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* =====================================================================
                  PASSO 1: SERVIÇOS SELECIONADOS & AJUSTE DE HORAS (Otimizado, Ocupando Todo Espaço Sem Scroll)
                 ===================================================================== */}
              {/* =====================================================================
                  PASSO 1: SERVIÇOS SELECIONADOS & AJUSTE DE HORAS (Otimizado, Sem Redundâncias e Zero Scroll)
                 ===================================================================== */}
              {step === 1 && (
                <div className="h-full flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2 animate-in fade-in duration-150">
                  {/* Cabeçalho do Passo 1 - Compacto e sem redundâncias */}
                  <div className="shrink-0 flex items-center justify-between pb-0.5">
                    <h2 className="font-chakra font-bold text-sm sm:text-base text-white uppercase tracking-wide flex items-center gap-2">
                      <span>1. Serviços Selecionados</span>
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#11203D] border border-[#1E335C] text-[10.5px] sm:text-xs font-mono text-[#FFC20E] font-bold shadow-sm">
                      {selectedServices.length} {selectedServices.length === 1 ? 'serviço' : 'serviços'}
                    </span>
                  </div>

                  {/* Lista de Cards de Serviços Otimizada Sem Scroll */}
                  <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto scrollbar-none">
                    {selectedServices.map(item => {
                      const srv = adminServices.find(s => s.id === item.serviceId);
                      const price = srv ? calculateServicePrice(srv, item.hours, item.complements) : 0;

                      return (
                        <div 
                          key={item.serviceId} 
                          className="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-3 rounded-[16px] bg-gradient-to-b from-[#0E1A33] via-[#0B1528] to-[#070F1E] border-2 border-[#1E335C] hover:border-[#FFC20E]/50 shadow-2xl transition-all gap-2"
                        >
                          {/* 1. Identificação do Serviço & Preço Base */}
                          <div className="shrink-0 flex items-center justify-between gap-2 border-b border-[#1E335C]/60 pb-1.5">
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-[5px] bg-[#FFC20E]/15 border border-[#FFC20E]/35 text-[#FFC20E] text-[10px] font-chakra font-extrabold uppercase tracking-wider shrink-0">
                                {srv?.category || 'Operação Tática'}
                              </span>
                              <h3 className="font-chakra font-extrabold text-sm sm:text-base text-white tracking-wide truncate">
                                {srv?.name || 'Serviço Tático'}
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono text-[#8E9BAE] shrink-0">
                              R$ {(srv?.basePrice || 0).toFixed(0)} base + R$ {(srv?.hourlyRate || 0).toFixed(0)}/h
                            </span>
                          </div>

                          {/* 2. Duração e Atalhos Rápidos (Compacto em linha única) */}
                          <div className="shrink-0 p-2 sm:p-2.5 rounded-[12px] bg-[#060D1B]/85 border border-[#1E335C] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10.5px] font-chakra font-bold text-[#8E9BAE] uppercase">
                                Duração:
                              </span>
                              <div className="flex items-center gap-1 bg-[#11203D] p-0.5 rounded-[8px] border border-[#1E335C]">
                                <button
                                  type="button"
                                  onClick={() => handleStep1ChangeHours(item.serviceId, item.hours - 1)}
                                  disabled={item.hours <= 1}
                                  aria-label="Diminuir 1 hora"
                                  className="w-6 h-6 rounded-[5px] bg-[#0E1A33] hover:bg-[#16264A] disabled:opacity-20 text-white flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>

                                <div className="px-2 py-0.5 rounded-[5px] bg-[#060D1B] border border-[#FFC20E]/50 font-mono font-bold text-xs text-[#FFC20E] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#FFC20E]" />
                                  <span>{item.hours}h</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleStep1ChangeHours(item.serviceId, item.hours + 1)}
                                  disabled={item.hours >= 72}
                                  aria-label="Aumentar 1 hora"
                                  className="w-6 h-6 rounded-[5px] bg-[#0E1A33] hover:bg-[#16264A] disabled:opacity-20 text-white flex items-center justify-center transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Atalhos Rápidos em linha */}
                            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                              {[2, 4, 8, 12, 24, 48].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleStep1ChangeHours(item.serviceId, preset)}
                                  className={`py-1 px-2 rounded-[6px] text-[10.5px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
                                    item.hours === preset
                                      ? 'bg-[#FFC20E] text-[#060D1B] font-extrabold shadow-[0_0_8px_rgba(255,194,14,0.4)]'
                                      : 'bg-[#11203D] hover:bg-[#16264A] text-[#8E9BAE] hover:text-white border border-[#1E335C]'
                                  }`}
                                >
                                  {preset}h
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Serviços Complementares Disponíveis (Grade Otimizada) */}
                          {(srv?.complements && srv.complements.length > 0) && (
                            <div className="shrink-0 p-2 sm:p-2.5 rounded-[12px] bg-[#060D1B]/85 border border-[#1E335C] space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-[#FFC20E]" />
                                  <span className="text-[10px] sm:text-xs font-chakra font-bold text-white uppercase tracking-wider">
                                    Serviços Complementares:
                                  </span>
                                </div>
                                <span className="text-[9.5px] sm:text-[10px] font-mono text-[#FFC20E] font-bold">
                                  {item.complements.length} de {srv.complements.length} ativo(s)
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {srv.complements.map((comp) => {
                                  const isChecked = item.complements.includes(comp.id);
                                  return (
                                    <button
                                      key={comp.id}
                                      type="button"
                                      onClick={() => handleStep1ToggleComplement(item.serviceId, comp.id)}
                                      className={`flex items-center justify-between p-1.5 sm:p-2 rounded-[8px] border transition-all cursor-pointer text-left ${
                                        isChecked
                                          ? 'bg-[#FFC20E]/15 border-[#FFC20E] text-white shadow-sm'
                                          : 'bg-[#11203D]/60 hover:bg-[#16264A] border-[#1E335C] text-[#C3CBDA]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                        <div
                                          className={`w-3.5 h-3.5 rounded-[4px] flex items-center justify-center shrink-0 border ${
                                            isChecked
                                              ? 'bg-[#FFC20E] border-[#FFC20E] text-[#060D1B]'
                                              : 'border-[#1E335C] bg-[#0E1A33]'
                                          }`}
                                        >
                                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                        <span className="text-[10.5px] sm:text-xs font-body font-medium truncate">
                                          {comp.name}
                                        </span>
                                      </div>
                                      <span className={`text-[10.5px] sm:text-xs font-mono font-bold shrink-0 ${isChecked ? 'text-[#FFC20E]' : 'text-[#8E9BAE]'}`}>
                                        +R$ {comp.price.toFixed(0)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo Consolidado de Horas, Complementos e Valor */}
                  <div className="shrink-0 p-2 sm:p-2.5 rounded-[12px] bg-gradient-to-r from-[#11203D] via-[#0E1A33] to-[#0A1428] border-2 border-[#FFC20E]/50 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#FFC20E]/15 border border-[#FFC20E]/50 flex items-center justify-center text-[#FFC20E] shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[9px] sm:text-[9.5px] font-chakra uppercase text-[#8E9BAE] block font-bold">
                          Tempo & Complementos da Operação
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-chakra font-bold text-white">
                          <span>{totalSelectedHours}h</span>
                          {totalStep1Complements > 0 && (
                            <span className="text-[#FFC20E] font-mono font-normal text-[10.5px]">
                              • {totalStep1Complements} {totalStep1Complements === 1 ? 'complemento' : 'complementos'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] sm:text-[9.5px] font-chakra uppercase text-[#8E9BAE] block font-bold">
                        Investimento Total
                      </span>
                      <span className="font-mono font-extrabold text-[#FFC20E] text-base sm:text-xl leading-none">
                        R$ {totalSelectedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  PASSO 2: ESCOLHA A DATA (Cards dos Meses Ampliados e Sem Scroll)
                 ===================================================================== */}
              {/* =====================================================================
                  PASSO 2: ESCOLHA A DATA (Calendário Ampliado ao Máximo e Sem Scroll)
                 ===================================================================== */}
              {step === 2 && (
                <div className="flex-1 min-h-0 flex flex-col justify-between h-full space-y-1.5 sm:space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="font-chakra font-bold text-sm sm:text-lg text-white uppercase tracking-wide">
                        2. Escolha a data
                      </h2>
                      <p className="text-[10.5px] sm:text-xs text-[#8E9BAE] truncate max-w-[280px] sm:max-w-md">
                        {selectedServices.map(s => adminServices.find(as => as.id === s.serviceId)?.name).filter(Boolean).join(', ')} • {totalSelectedHours}h
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-[#FFC20E] hover:underline font-chakra uppercase tracking-wider shrink-0 cursor-pointer font-bold"
                    >
                      Alterar
                    </button>
                  </div>

                  {/* Card do Calendário Mensal Ampliado ao Máximo */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between p-3 sm:p-4 rounded-[18px] sm:rounded-[20px] bg-[#0E1A33]/95 border-2 border-[#1E335C] shadow-2xl overflow-hidden">
                    
                    {/* Seletor Rápido: Cards dos Meses Operacionais Ampliados */}
                    <div className="shrink-0">
                      <span className="text-[9.5px] sm:text-[10.5px] font-chakra uppercase text-[#8E9BAE] font-bold tracking-wider block mb-1">
                        Selecione o Mês:
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                        {availableMonthCards.map((m) => {
                          const isSelectedMonth = currentCalendarMonth === m.monthIndex && currentCalendarYear === m.year;
                          return (
                            <button
                              key={`${m.year}-${m.monthIndex}`}
                              type="button"
                              onClick={() => {
                                setCurrentCalendarMonth(m.monthIndex);
                                setCurrentCalendarYear(m.year);
                              }}
                              className={`py-2 sm:py-2.5 px-1.5 rounded-[12px] border text-center transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                                isSelectedMonth
                                  ? 'bg-[#FFC20E] text-[#060D1B] border-[#FFC20E] font-extrabold shadow-[0_0_14px_rgba(255,194,14,0.4)] scale-102 ring-2 ring-[#FFC20E]'
                                  : 'bg-[#11203D]/90 hover:bg-[#16264A] text-white border-[#1E335C] hover:border-[#FFC20E]/50'
                              }`}
                            >
                              <span className={`text-xs sm:text-sm font-chakra font-extrabold uppercase tracking-wider leading-tight ${isSelectedMonth ? 'text-[#060D1B]' : 'text-white'}`}>
                                {m.shortLabel}
                              </span>
                              <span className={`text-[9px] sm:text-[10px] font-mono leading-none mt-0.5 ${isSelectedMonth ? 'text-[#060D1B]/90 font-bold' : 'text-[#8E9BAE]'}`}>
                                {m.year}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Barra de Navegação do Mês Selecionado */}
                    <div className="shrink-0 flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-[12px] bg-[#11203D]/80 border border-[#1E335C]/80 my-0.5 sm:my-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={!canGoPrevMonth}
                        aria-label="Mês anterior"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-[9px] bg-[#0E1A33] hover:bg-[#16264A] disabled:opacity-20 text-white border border-[#1E335C] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      <div className="text-center">
                        <span className="block text-sm sm:text-base font-chakra font-extrabold text-white uppercase tracking-wider">
                          {MONTH_NAMES[currentCalendarMonth]} <span className="text-[#FFC20E]">{currentCalendarYear}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="Próximo mês"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-[9px] bg-[#0E1A33] hover:bg-[#16264A] text-white border border-[#1E335C] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {/* Cabeçalho dos Dias da Semana */}
                    <div className="shrink-0 grid grid-cols-7 gap-1 sm:gap-1.5 text-center font-chakra text-[10px] sm:text-[11.5px] font-bold text-[#8E9BAE] py-0.5">
                      {WEEKDAY_HEADERS.map(w => (
                        <div key={w}>
                          {w}
                        </div>
                      ))}
                    </div>

                    {/* Grade de Dias do Mês com Células Ampliadas ao Máximo */}
                    <div className="flex-1 min-h-0 grid grid-cols-7 gap-1 sm:gap-1.5 content-stretch items-stretch py-0.5">
                      {calendarDays.map((cell, idx) => {
                        if (!cell.isCurrentMonth || !cell.date) {
                          return <div key={`empty-${idx}`} className="h-full min-h-[32px] sm:min-h-[38px] max-h-[46px]" />;
                        }

                        const isDisabled = cell.isPast;
                        const isSelected = cell.isSelected;

                        return (
                          <button
                            key={`day-${cell.dayNumber}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (cell.date) setSelectedDate(cell.date);
                            }}
                            className={`h-full min-h-[32px] sm:min-h-[38px] max-h-[46px] rounded-[10px] sm:rounded-[12px] flex flex-col items-center justify-center relative transition-all cursor-pointer active:scale-95 ${
                              isDisabled
                                ? 'opacity-25 cursor-not-allowed text-[#8E9BAE]'
                                : isSelected
                                ? 'bg-[#FFC20E] text-[#060D1B] font-extrabold shadow-[0_0_14px_rgba(255,194,14,0.45)] scale-102 z-10 ring-2 ring-[#FFC20E]'
                                : 'bg-[#11203D]/80 hover:bg-[#16264A] text-white border border-[#1E335C] hover:border-[#FFC20E]/50'
                            }`}
                          >
                            <span className="text-xs sm:text-sm md:text-base font-mono font-bold leading-none">
                              {cell.dayNumber}
                            </span>
                            {!isDisabled && (
                              <span 
                                className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                  isSelected ? 'bg-[#060D1B]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                }`} 
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legenda de Disponibilidade */}
                    <div className="shrink-0 flex items-center justify-center gap-5 pt-1 text-[10px] sm:text-[11.5px] font-chakra text-[#8E9BAE] border-t border-[#1E335C]/50">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        <span className="font-semibold text-[#C3CBDA]">Disponível para Missão</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#8E9BAE]/30" />
                        <span>Indisponível / Passado</span>
                      </div>
                    </div>
                  </div>

                  {/* Banner de Data Selecionada */}
                  {selectedDate && (
                    <div className="shrink-0 p-2.5 sm:p-3 rounded-[12px] bg-gradient-to-r from-[#11203D] to-[#0E1A33] border border-[#FFC20E]/40 flex items-center justify-center text-xs sm:text-sm text-white shadow-md">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#FFC20E] shrink-0" />
                        <span className="text-xs sm:text-sm font-chakra">
                          Data Selecionada: <strong className="text-[#FFC20E] uppercase font-bold">{formatSelectedDateFull(selectedDate)}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =====================================================================
                  PASSO 3: ESCOLHA O HORÁRIO (Card de Horários Ampliado ao Máximo e Sem Scroll)
                 ===================================================================== */}
              {step === 3 && (
                <div className="flex-1 min-h-0 flex flex-col justify-between h-full space-y-1.5 sm:space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="font-chakra font-bold text-sm sm:text-lg text-white uppercase tracking-wide">
                        3. Escolha o horário de início
                      </h2>
                      <p className="text-[10.5px] sm:text-xs text-[#8E9BAE] truncate max-w-[260px] sm:max-w-md">
                        {formatSelectedDateFull(selectedDate)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-2.5 py-1 rounded-[8px] bg-[#11203D] hover:bg-[#16264A] text-xs font-chakra font-semibold text-[#FFC20E] border border-[#1E335C] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trocar data</span>
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col justify-between p-3 sm:p-4 rounded-[18px] sm:rounded-[20px] bg-[#0E1A33]/95 border-2 border-[#1E335C] shadow-2xl overflow-hidden">
                    {/* Filtros de Turno */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#1E335C]/60 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[9px] bg-[#FFC20E]/10 border border-[#FFC20E]/30 flex items-center justify-center text-[#FFC20E] shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-chakra font-extrabold text-white uppercase tracking-wider block leading-tight">
                            Janelas de Início
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-[#8E9BAE] font-mono leading-none">
                            {filteredTimeSlots.length} horários disponíveis
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-[#11203D] p-1 rounded-[10px] border border-[#1E335C]/80">
                        {(['todos', 'manha', 'tarde', 'noite'] as const).map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setTimeFilter(f)}
                            className={`px-2.5 sm:px-3 py-1 rounded-[7px] text-[10.5px] sm:text-xs font-chakra transition-all cursor-pointer capitalize font-bold ${
                              timeFilter === f 
                                ? 'bg-[#FFC20E] text-[#060D1B] font-extrabold shadow-sm' 
                                : 'text-[#8E9BAE] hover:text-white'
                            }`}
                          >
                            {f === 'todos' ? 'Todos' : f === 'manha' ? 'Manhã' : f === 'tarde' ? 'Tarde' : 'Noite'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Grade de Botões de Horários Otimizados - Ocupa Harmonicamente o Interior do Card Sem Scroll */}
                    <div className={`flex-1 min-h-0 grid grid-cols-4 ${
                      filteredTimeSlots.length > 8 
                        ? 'grid-rows-6 gap-1.5 sm:gap-2 py-2 sm:py-2.5' 
                        : 'grid-rows-2 gap-2 sm:gap-3 py-2 sm:py-3 content-start'
                    } items-stretch overflow-hidden`}>
                      {filteredTimeSlots.map(time => {
                        const isSelected = selectedTimeSlot === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTimeSlot(time)}
                            className={`h-full min-h-[35px] sm:min-h-[40px] max-h-[50px] px-1.5 sm:px-2 rounded-[9px] sm:rounded-[12px] text-xs sm:text-[13px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#FFC20E] text-[#060D1B] font-extrabold shadow-[0_0_12px_rgba(255,194,14,0.4)] scale-102 ring-2 ring-[#FFC20E]'
                                : 'bg-[#0E1A33]/85 hover:bg-[#122244] text-white border border-[#1E335C]/70 hover:border-[#FFC20E]/50 shadow-sm'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#060D1B]' : 'text-[#FFC20E]'}`} />
                            <span className="tracking-wide">{time}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Duração Calculada e Janela Reservada */}
                    <div className="shrink-0 p-2.5 sm:p-3 rounded-[14px] bg-[#11203D]/90 border border-[#FFC20E]/35 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8E9BAE] font-chakra uppercase font-semibold text-[11px] sm:text-xs">Duração:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0E1A33] border border-[#FFC20E]/40 font-mono text-[#FFC20E] font-bold text-xs sm:text-sm">
                          {totalSelectedHours}h {totalSelectedHours >= 24 ? `(${Math.floor(totalSelectedHours / 24)}d ${totalSelectedHours % 24 > 0 ? `${totalSelectedHours % 24}h` : ''})` : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#8E9BAE] font-chakra text-[11px] sm:text-xs">Janela: </span>
                        <strong className="text-white font-mono text-xs sm:text-sm font-bold block sm:inline">{startTimeStr} às {endTimeStr}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  PASSO 4: SEUS DADOS DE CONTATO (Card Ampliado ao Máximo e Sem Scroll)
                 ===================================================================== */}
              {step === 4 && (
                <div className="flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-2 animate-in fade-in duration-150 min-h-0">
                  <div className="shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="font-chakra font-bold text-sm sm:text-base text-white uppercase tracking-wide">
                        4. Seus dados de contato
                      </h2>
                      <p className="text-[10px] sm:text-xs text-[#8E9BAE]">
                        Confirmação e detalhes operacionais enviados via WhatsApp.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFC20E]/10 text-[#FFC20E] border border-[#FFC20E]/30 font-bold">
                      Etapa 4 de 5
                    </span>
                  </div>

                  {/* Card Otimizado, Moderno e Harmoniosamente Preenchido */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between p-3.5 sm:p-5 rounded-[18px] sm:rounded-[20px] bg-[#0E1A33]/95 border-2 border-[#1E335C] shadow-2xl overflow-hidden">
                    <div className="flex-1 min-h-0 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                      
                      {/* Campo 1: Nome Completo */}
                      <div>
                        <label className="block text-[10.5px] sm:text-[11.5px] font-chakra font-bold text-[#8E9BAE] uppercase tracking-wider mb-1">
                          Nome Completo *
                        </label>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-[#FFC20E] absolute left-3.5 pointer-events-none" />
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Como você prefere ser chamado(a)?"
                            className="w-full bg-[#11203D] hover:bg-[#132549] border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none transition-all shadow-inner font-body"
                          />
                        </div>
                      </div>

                      {/* Campo 2: WhatsApp com DDD */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10.5px] sm:text-[11.5px] font-chakra font-bold text-[#8E9BAE] uppercase tracking-wider">
                            WhatsApp / Telefone com DDD *
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
                            value={clientPhone}
                            onChange={(e) => setClientPhone(formatPhoneBR(e.target.value))}
                            placeholder="(00) 00000-0000"
                            className="w-full bg-[#11203D] hover:bg-[#132549] border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none font-mono tracking-wide transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Campo 3: Endereço da Operação (Campo Ampliado Sem Corte de Texto + Botão GPS Maior e Dourado) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <div>
                            <label className="text-[10.5px] sm:text-[11.5px] font-chakra font-bold text-white uppercase tracking-wider block">
                              Endereço da Operação *
                            </label>
                            <span className="text-[9.5px] sm:text-[10px] text-[#8E9BAE]">
                              Local de atendimento ou ponto de encontro
                            </span>
                          </div>
                          
                          {/* Botão Usar GPS Maior, Moderno e Dourado */}
                          <button
                            type="button"
                            onClick={handleGeolocate}
                            disabled={isLocating}
                            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-[10px] bg-gradient-to-r from-[#FFC20E] via-[#FFD043] to-[#E5A800] text-[#060D1B] font-chakra font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,194,14,0.35)] hover:shadow-[0_0_18px_rgba(255,194,14,0.5)] active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                            title="Localizar endereço completo via GPS (rua, número, cidade, estado e CEP)"
                          >
                            <LocateFixed className={`w-3.5 h-3.5 text-[#060D1B] shrink-0 ${isLocating ? 'animate-spin' : ''}`} />
                            <span>{isLocating ? 'Buscando GPS...' : 'Usar GPS'}</span>
                          </button>
                        </div>

                        {/* Campo de Endereço em Textarea para Exibir Todo o Texto Sem Cortes */}
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-[#FFC20E] absolute left-3.5 top-3 pointer-events-none" />
                          <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            placeholder="Rua, número, bairro, cidade, estado e CEP *"
                            className="w-full bg-[#11203D] hover:bg-[#132549] border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none transition-all shadow-inner font-body resize-none leading-relaxed min-h-[58px] sm:min-h-[66px]"
                          />
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-[#8E9BAE] mt-1 block">
                          Ex: Rua das Palmeiras, 150 - Praia do Canto, Vitória - ES, CEP: 29055-000
                        </span>
                      </div>

                      {/* Campo 4: Observações Operacionais */}
                      <div>
                        <label className="block text-[10.5px] sm:text-[11.5px] font-chakra font-bold text-[#8E9BAE] uppercase tracking-wider mb-1">
                          Observações Operacionais (Opcional)
                        </label>
                        <div className="relative">
                          <FileText className="w-4 h-4 text-[#FFC20E] absolute left-3.5 top-2.5 pointer-events-none" />
                          <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ponto de encontro, vestimenta ou detalhes da operação..."
                            rows={2}
                            className="w-full bg-[#11203D] hover:bg-[#132549] border border-[#1E335C] focus:border-[#FFC20E] rounded-[10px] pl-10 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-[#8E9BAE] focus:outline-none resize-none transition-all shadow-inner font-body min-h-[50px] sm:min-h-[58px]"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Selo de Garantia e Sigilo Operacional TRANSEG - Preenche o Card com Propósito */}
                    <div className="shrink-0 mt-2.5 p-2.5 rounded-[12px] bg-[#11203D]/70 border border-[#1E335C] flex items-center justify-between text-xs text-[#8E9BAE]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#FFC20E] shrink-0" />
                        <span className="text-[10.5px] sm:text-[11.5px]">
                          Sigilo Operacional & Criptografia Ponta a Ponta
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-mono text-emerald-400 font-bold flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                        CCO 24h
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* =====================================================================
                  PASSO 5: CONFIRMAÇÃO DO AGENDAMENTO (Otimizado, Sem Cortes e Zero Scroll)
                 ===================================================================== */}
              {step === 5 && (
                <div className="flex-1 min-h-0 flex flex-col justify-between h-full space-y-1 sm:space-y-1.5 animate-in fade-in duration-150">
                  {/* Cabeçalho do Passo 5 */}
                  <div className="shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="font-chakra font-bold text-sm sm:text-base text-white uppercase tracking-wide flex items-center gap-2">
                        <span>5. Confirmação do agendamento</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFC20E]/15 border border-[#FFC20E]/40 text-[9.5px] sm:text-[10px] font-mono text-[#FFC20E] font-bold">
                          ETAPA FINAL
                        </span>
                      </h2>
                      <p className="text-[10px] sm:text-xs text-[#8E9BAE]">
                        Revise todos os parâmetros operacionais antes de confirmar a missão.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-2.5 py-1 rounded-[8px] bg-[#11203D] hover:bg-[#16264A] border border-[#1E335C] hover:border-[#FFC20E]/50 text-[10.5px] font-chakra font-bold text-[#FFC20E] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                    >
                      Alterar Serviços
                    </button>
                  </div>

                  {/* Card Consolidado Principal: Sem Espaços Vazios, Sem Cortes e Sem Scroll */}
                  <div className="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-3.5 rounded-[18px] bg-gradient-to-b from-[#0E1A33] via-[#0B1528] to-[#070F1E] border-2 border-[#1E335C] shadow-2xl overflow-y-auto scrollbar-none gap-2">
                    
                    {/* 1. MÓDULO: PROCEDIMENTO, HORAS & SERVIÇOS COMPLEMENTARES */}
                    <div className="shrink-0 p-2 sm:p-2.5 rounded-[12px] bg-[#060D1B]/85 border border-[#1E335C] space-y-1.5">
                      <div className="flex items-center justify-between border-b border-[#1E335C]/60 pb-1">
                        <span className="text-[10px] sm:text-[10.5px] font-chakra font-bold text-[#8E9BAE] uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#FFC20E]" />
                          <span>Procedimento & Escopo Tático</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#FFC20E] font-bold">
                          {selectedServices.length} {selectedServices.length === 1 ? 'Serviço' : 'Serviços'} • {totalSelectedHours}h
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {selectedServices.map(item => {
                          const srv = adminServices.find(as => as.id === item.serviceId);
                          const activeComps = (srv?.complements || []).filter(c => item.complements.includes(c.id));
                          return (
                            <div key={item.serviceId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs sm:text-sm font-chakra font-bold text-white">
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC20E] shrink-0" />
                                  <span className="break-words leading-tight">{srv?.name || 'Serviço Tático'}</span>
                                </div>
                                <span className="font-mono text-[#FFC20E] shrink-0 text-xs sm:text-sm bg-[#11203D] px-2 py-0.5 rounded-[6px] border border-[#1E335C]">
                                  {item.hours}h
                                </span>
                              </div>

                              {/* Serviços Complementares Deste Serviço */}
                              {activeComps.length > 0 ? (
                                <div className="pl-3 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[9.5px] font-chakra uppercase font-bold text-[#FFC20E] flex items-center gap-1 mr-1">
                                      <Sparkles className="w-2.5 h-2.5 text-[#FFC20E]" />
                                      <span>Complementos:</span>
                                    </span>
                                    {activeComps.map(comp => (
                                      <span
                                        key={comp.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#FFC20E]/15 border border-[#FFC20E]/40 text-[#FFC20E] text-[10px] sm:text-[10.5px] font-mono font-medium shadow-sm"
                                      >
                                        <span>{comp.name}</span>
                                        <span className="font-bold text-white">(+R$ {comp.price.toFixed(2)})</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="pl-3 flex items-center justify-between text-[9.5px] sm:text-[10px] font-mono text-[#8E9BAE]">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-[#8E9BAE]/60" />
                                    <span>Serviços complementares: Nenhum adicional selecionado</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-[9.5px] font-chakra text-[#FFC20E] hover:underline font-bold uppercase cursor-pointer"
                                  >
                                    + Adicionar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. MÓDULO: LOGÍSTICA & CONTATO (SEM CORTES NOS TEXTOS) */}
                    <div className="shrink-0 p-2 sm:p-2.5 rounded-[12px] bg-[#060D1B]/85 border border-[#1E335C] space-y-2">
                      {/* Data e Horário em 2 Colunas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-[#1E335C]/60 pb-2">
                        {/* Data */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-[6px] bg-[#11203D] border border-[#1E335C] flex items-center justify-center text-[#FFC20E] shrink-0">
                            <CalendarIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[9px] sm:text-[9.5px] font-chakra uppercase font-bold text-[#8E9BAE]">
                              Data da Operação
                            </span>
                            <span className="block text-xs sm:text-[12.5px] font-semibold text-white break-words leading-tight">
                              {formatSelectedDateFull(selectedDate)}
                            </span>
                          </div>
                        </div>

                        {/* Janela Operacional */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-[6px] bg-[#11203D] border border-[#1E335C] flex items-center justify-center text-[#FFC20E] shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[9px] sm:text-[9.5px] font-chakra uppercase font-bold text-[#8E9BAE]">
                              Horário Reservado
                            </span>
                            <span className="block text-xs sm:text-[12.5px] font-mono font-bold text-[#FFC20E] leading-tight">
                              {startTimeStr} às {endTimeStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Solicitante / Contato sem parênteses duplicados */}
                      <div className="flex items-center gap-2 border-b border-[#1E335C]/60 pb-2">
                        <div className="w-6 h-6 rounded-[6px] bg-[#11203D] border border-[#1E335C] flex items-center justify-center text-[#FFC20E] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9px] sm:text-[9.5px] font-chakra uppercase font-bold text-[#8E9BAE]">
                            Cliente Solicitante / Contato
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-[12.5px]">
                            <span className="font-semibold text-white break-words">{clientName}</span>
                            {clientPhone && (
                              <span className="font-mono text-[#FFC20E] font-medium text-xs bg-[#11203D] px-2 py-0.5 rounded-[5px] border border-[#1E335C]">
                                {clientPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Endereço Completo: Sem reticências, sem corte, quebra de linha natural */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-[6px] bg-[#11203D] border border-[#1E335C] flex items-center justify-center text-[#FFC20E] shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9px] sm:text-[9.5px] font-chakra uppercase font-bold text-[#8E9BAE]">
                            Local de Atendimento / Endereço Completo
                          </span>
                          <p className="text-xs sm:text-[12.5px] font-medium text-white leading-relaxed break-words">
                            {address}
                          </p>
                        </div>
                      </div>

                      {/* Observações Operacionais se preenchidas */}
                      {observations.trim() && (
                        <div className="flex items-start gap-2 pt-1 border-t border-[#1E335C]/40">
                          <FileText className="w-3.5 h-3.5 text-[#8E9BAE] shrink-0 mt-0.5" />
                          <p className="text-[10px] sm:text-[10.5px] text-[#C3CBDA] italic break-words">
                            Obs: {observations.trim()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. MÓDULO: RESUMO FINANCEIRO CONSOLIDADO */}
                    <div className="shrink-0 p-2.5 sm:p-3 rounded-[14px] bg-gradient-to-r from-[#11203D] via-[#0E1A33] to-[#0A1428] border-2 border-[#FFC20E]/50 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
                      <div>
                        <span className="text-[9.5px] sm:text-[10px] font-chakra uppercase text-[#8E9BAE] block font-bold tracking-wider">
                          Composição dos Valores:
                        </span>
                        <div className="flex items-center gap-2 text-[10.5px] font-mono text-[#C3CBDA] flex-wrap">
                          <span>Base ({totalSelectedHours}h): R$ {baseAndHoursTotal.toFixed(2)}</span>
                          {complementsTotal > 0 && (
                            <span className="text-[#FFC20E] font-semibold">
                              • Complementos: +R$ {complementsTotal.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9.5px] sm:text-[10px] font-chakra uppercase text-[#8E9BAE] block font-bold tracking-wider">
                          Investimento Total
                        </span>
                        <span className="font-mono font-extrabold text-[#FFC20E] text-lg sm:text-2xl leading-none drop-shadow-[0_0_12px_rgba(255,194,14,0.35)]">
                          R$ {totalSelectedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* 4. MÓDULO: DIRETRIZES & POLÍTICA INTEGRADA AO CARD */}
                    <div className="shrink-0 px-2.5 py-1.5 rounded-[10px] bg-[#11203D]/60 border border-[#1E335C]/60 flex items-center justify-between gap-2 text-[9px] sm:text-[10px] text-[#8E9BAE]">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#FFC20E]" />
                        <span className="font-chakra font-bold text-white uppercase">
                          Diretrizes Operacionais:
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[#C3CBDA] truncate">
                        <span>• Tolerância: 15 min</span>
                        <span className="hidden sm:inline">• Cancelamento: até 24h</span>
                        <span className="text-[#FFC20E] font-medium">• Despacho CCO 24h</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* =========================================================================
          4. RODAPÉ FIXO DE AÇÃO (Texto em Linha Única e Proporção Equilibrada)
         ========================================================================= */}
      {!isSuccess && (
        <footer className="shrink-0 pt-1.5 pb-0.5">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botão de Cancelar / Voltar - Largura compacta proporcional */}
            <button
              type="button"
              onClick={handlePrevStep}
              className="shrink-0 px-4 sm:px-6 py-2.5 rounded-[10px] bg-[#11203D] hover:bg-[#16264A] text-xs sm:text-sm font-chakra font-bold text-[#8E9BAE] hover:text-white border border-[#1E335C] transition-all cursor-pointer text-center uppercase tracking-wider whitespace-nowrap active:scale-95 shadow-sm"
            >
              {step === 1 ? 'CANCELAR' : 'VOLTAR'}
            </button>

            {/* Botão Principal de Ação - Todo o espaço restante com texto em LINHA ÚNICA */}
            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex-1 min-w-0 py-2.5 px-3 sm:px-5 rounded-[10px] bg-[#FFC20E] hover:bg-[#FFD75E] text-[#060D1B] text-xs sm:text-sm font-chakra font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(255,194,14,0.35)] transition-all cursor-pointer active:scale-98 disabled:opacity-50 overflow-hidden"
            >
              {isSubmitting ? (
                <span className="whitespace-nowrap">PROCESSANDO...</span>
              ) : step === 5 ? (
                <>
                  <span className="whitespace-nowrap truncate">CONFIRMAR AGENDAMENTO</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
                </>
              ) : step === 2 ? (
                <>
                  <span className="whitespace-nowrap truncate">CONTINUAR: ESCOLHER HORÁRIO</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                </>
              ) : step === 3 ? (
                <>
                  <span className="whitespace-nowrap truncate">CONTINUAR: DADOS DO CLIENTE</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                </>
              ) : step === 4 ? (
                <>
                  <span className="whitespace-nowrap truncate">AVANÇAR: REVISÃO FINAL</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                </>
              ) : (
                <>
                  <span className="whitespace-nowrap truncate">CONTINUAR: ESCOLHER DATA</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5] shrink-0" />
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};
