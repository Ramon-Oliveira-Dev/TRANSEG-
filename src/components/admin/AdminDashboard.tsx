import React, { useState } from 'react';
import { 
  Radio, 
  ShieldAlert, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  X, 
  BarChart3, 
  Calendar, 
  Zap, 
  Shield, 
  Volume2, 
  Database,
  Layers,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  ORDERED_SERVICE_STATUSES, 
  ALL_SERVICE_TYPES,
  AdminServiceItem
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { SectionHeader } from '../common/SectionHeader';
import { playPanicAlarmSound } from '../../utils/sound';
import { 
  FullscreenSelectModal, 
  FullscreenSelectTrigger,
  FullscreenSelectOption 
} from '../common/FullscreenSelectModal';

export const AdminDashboard: React.FC = () => {
  const { 
    allRequests, 
    professionals, 
    clients, 
    panicAlerts, 
    activePanicAlerts, 
    resolvePanicAlert,
    assignProfessionalToRequest,
    cancelServiceRequest,
    approveProfessional,
    toggleProfessionalActive,
    adminCreateProfessional,
    adminServices,
    addAdminService,
    deleteAdminService,
    toggleAdminServiceActive,
    supabaseStatus,
    setIsSupabaseModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pedidos' | 'servicos' | 'profissionais' | 'clientes' | 'alertas' | 'relatorio'>('pedidos');

  // Modal state for creating a new professional
  const [showCreateProModal, setShowCreateProModal] = useState(false);
  const [newProName, setNewProName] = useState('');
  const [newProEmail, setNewProEmail] = useState('');
  const [newProPhone, setNewProPhone] = useState('');
  const [newProPassword, setNewProPassword] = useState('');
  const [createProError, setCreateProError] = useState<string | null>(null);
  const [createProSuccess, setCreateProSuccess] = useState<string | null>(null);

  // Modal state for creating a new catalog service
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Escolta VIP');
  const [newServiceTag, setNewServiceTag] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceBasePrice, setNewServiceBasePrice] = useState('250');
  const [newServiceHourlyRate, setNewServiceHourlyRate] = useState('120');
  const [newServiceDefaultHours, setNewServiceDefaultHours] = useState('4');
  const [newServiceImage, setNewServiceImage] = useState('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80');
  const [createServiceError, setCreateServiceError] = useState<string | null>(null);
  const [createServiceSuccess, setCreateServiceSuccess] = useState<string | null>(null);

  // Manual assignment dropdown tracking: { [requestId]: professionalId }
  const [selectedProForReq, setSelectedProForReq] = useState<Record<string, string>>({});
  const [proSelectorReqId, setProSelectorReqId] = useState<string | null>(null);

  // Filter available, approved, and active professionals for assignment
  const eligibleProfessionals = professionals.filter(p => p.aprovado && p.ativo && p.disponivel);

  const proSelectorOptions: FullscreenSelectOption[] = eligibleProfessionals.map((pro) => ({
    value: pro.id,
    label: pro.name,
    sublabel: pro.phone ? `Contato: ${pro.phone}` : undefined,
    description: `Agente Tático homologado · Status operacional: ${pro.disponivel ? 'Disponível para pronto despacho' : 'Em atendimento'}`,
    badge: pro.disponivel ? 'Disponível' : 'Ocupado',
    badgeColor: pro.disponivel ? 'green' : 'gold',
    icon: <Shield className="w-5 h-5 text-[#FFC20E]" />,
  }));

  const handleAssignClick = (reqId: string) => {
    const proId = selectedProForReq[reqId];
    if (!proId) {
      alert('Selecione um profissional disponível na lista para realizar a atribuição.');
      return;
    }
    const res = assignProfessionalToRequest(reqId, proId);
    if (!res.success) {
      alert(res.message);
    }
  };

  const handleAdminCreateProSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateProError(null);
    setCreateProSuccess(null);

    if (!newProName.trim() || !newProEmail.trim() || !newProPhone.trim()) {
      setCreateProError('Preencha todos os campos obrigatórios.');
      return;
    }

    const res = adminCreateProfessional({
      name: newProName,
      email: newProEmail,
      phone: newProPhone,
      password: newProPassword || 'senha123',
    });

    if (res.success) {
      setCreateProSuccess(res.message || 'Profissional cadastrado!');
      setNewProName('');
      setNewProEmail('');
      setNewProPhone('');
      setNewProPassword('');
      setTimeout(() => {
        setShowCreateProModal(false);
        setCreateProSuccess(null);
      }, 1500);
    } else {
      setCreateProError(res.message || 'Falha ao cadastrar profissional.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-6 font-body text-[#3D4757]">
      {/* 1. BANNER FIXO DE ALERTAS DE PÂNICO ATIVOS (VERMELHO PULSANTE) */}
      {activePanicAlerts.length > 0 && (
        <div className="bg-[#DC2626] text-white rounded-[12px] p-5 sm:p-6 shadow-2xl border-2 border-white/30 space-y-4 pulse-panic-active">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
              <h3 className="font-display font-bold text-base sm:text-lg tracking-wider uppercase">
                ALERTA DE EMERGÊNCIA / PÂNICO ATIVO ({activePanicAlerts.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => playPanicAlarmSound()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white rounded-[6px] text-xs font-semibold cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Testar Sinal Sonoro
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activePanicAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-black/25 border border-white/20 rounded-[8px] p-4 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold tracking-widest text-[#FFC20E]">
                    CHAMADO {alert.requestCode} — {alert.serviceType}
                  </span>
                  <span className="text-[11px] text-white/80 font-mono">
                    {new Date(alert.createdAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-white">
                    <MapPin className="w-3.5 h-3.5 text-[#FFC20E] shrink-0" />
                    <span className="truncate">{alert.address}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-white/70 block text-[10px]">Cliente Solicitante:</span>
                      <span className="font-bold">{alert.clientName}</span>
                    </div>
                    {alert.clientPhone && (
                      <a
                        href={`tel:${alert.clientPhone.replace(/\D/g, '')}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFC20E] text-[#060D1B] font-bold rounded-[6px] text-[11px] hover:bg-[#FFD75E]"
                      >
                        <PhoneCall className="w-3 h-3" />
                        Ligar: {alert.clientPhone}
                      </a>
                    )}
                  </div>

                  {alert.professionalName && (
                    <div className="pt-1 text-[11px] text-white/80">
                      Profissional designado: <strong className="text-white">{alert.professionalName}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => resolvePanicAlert(alert.id)}
                    className="px-4 py-1.5 bg-white text-[#DC2626] hover:bg-slate-100 font-display font-bold text-xs uppercase tracking-wider rounded-[6px] transition-colors shadow cursor-pointer"
                  >
                    Marcar como Resolvido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEADER DA CENTRAL */}
      <SectionHeader
        title="Centro de Controle Operacional (CCO)"
        subtitle="Gerenciamento centralizado de pedidos, escala de vigilantes e monitoramento tático em tempo real."
        lightBg={true}
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border text-xs font-mono font-medium transition-colors cursor-pointer ${
                supabaseStatus.connected
                  ? 'bg-emerald-50 border-emerald-300 text-[#16A34A] hover:bg-emerald-100'
                  : 'bg-white border-[#DDE1E8] text-[#3D4757] hover:bg-[#F3F4F6]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="hidden xs:inline">Supabase:</span>
              <span className="capitalize">{supabaseStatus.connected ? 'Online' : 'Configurar'}</span>
              <span className={`w-2 h-2 rounded-full ${
                supabaseStatus.connected ? 'bg-[#16A34A]' : 'bg-[#FFC20E]'
              }`} />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0A1428] text-white">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#FFC20E]">
                CCO ATIVO
              </span>
            </div>
          </div>
        }
      />

      {/* TABS DE NAVEGAÇÃO CCO */}
      <div className="flex flex-wrap gap-2 pb-1">
        {[
          { id: 'pedidos', label: 'Quadro de Pedidos', count: allRequests.length, icon: Clock },
          { id: 'servicos', label: 'Catálogo de Serviços', count: adminServices.length, icon: Layers },
          { id: 'profissionais', label: 'Profissionais', count: professionals.length, icon: Shield },
          { id: 'clientes', label: 'Clientes', count: clients.length, icon: Users },
          { id: 'alertas', label: 'Alertas SOS', count: panicAlerts.length, icon: AlertTriangle },
          { id: 'relatorio', label: 'Relatório', count: null, icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-[8px] font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#0A1428] text-white shadow-sm'
                  : 'bg-white border border-[#DDE1E8] text-[#3D4757] hover:bg-[#F3F4F6]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFC20E]' : 'text-[#3D4757]'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[11px] font-mono ${isActive ? 'text-[#FFC20E]' : 'text-[#8E9BAE]'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ABA 1: PEDIDOS AGRUPADOS POR STATUS NA ORDEM DA MÁQUINA DE ESTADOS */}
      {activeTab === 'pedidos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#3D4757]">
            <span>Quadro operacional de pedidos:</span>
            <span className="font-semibold text-[#0A1428]">
              Profissionais Disponíveis Agora: {eligibleProfessionals.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {ORDERED_SERVICE_STATUSES.map((status) => {
              let items = allRequests.filter(r => r.status === status);
              if (status === 'Concluído' || status === 'Cancelado') {
                items = items.slice(0, 4);
              }

              return (
                <div
                  key={status}
                  className="card-transeg p-4 flex flex-col space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#DDE1E8] pb-2.5">
                    <StatusBadge status={status} size="sm" />
                    <span className="text-xs font-bold text-[#3D4757]">
                      {items.length} {items.length === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {items.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#8E9BAE] italic">
                        Nenhum pedido neste status
                      </div>
                    ) : (
                      items.map((req) => (
                        <div
                          key={req.id}
                          className="bg-[#F3F4F6] border border-[#DDE1E8] rounded-[8px] p-3 text-xs space-y-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="eyebrow text-[#0A1428] block text-[10px]">
                                {req.code}
                              </span>
                              <h4 className="font-display font-bold text-[#0A1428] text-xs">
                                {req.serviceType}
                              </h4>
                            </div>
                            <span className="text-[10px] text-[#3D4757] font-mono">
                              {new Date(req.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#3D4757] space-y-1">
                            <div className="truncate">
                              <strong className="text-[#0A1428]">Cliente:</strong> {req.client.name}
                            </div>
                            <div className="truncate text-[#3D4757]">
                              {req.address}
                            </div>
                            <div>
                              {req.isImmediate ? (
                                <span className="text-[#0A1428] font-bold text-[10px] flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-[#FFC20E]" /> Imediato
                                </span>
                              ) : (
                                <span className="text-[#3D4757] text-[10px] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {req.scheduledDateTime ? new Date(req.scheduledDateTime).toLocaleString('pt-BR') : 'Agendado'}
                                </span>
                              )}
                            </div>
                          </div>

                          {req.professional && (
                            <div className="pt-1.5 border-t border-[#DDE1E8] text-[11px]">
                              <span className="text-[#3D4757]">Agente: </span>
                              <strong className="text-[#0A1428]">{req.professional.name}</strong>
                              <span className="text-[#8E9BAE] ml-1">
                                {req.accepted ? '(Aceito)' : '(Aguardando)'}
                              </span>
                            </div>
                          )}

                          {/* EM "PENDENTE": SELETOR DE PROFISSIONAIS + ATRIBUIÇÃO */}
                          {req.status === 'Pendente' && (
                            <div className="pt-2 border-t border-[#DDE1E8] space-y-2">
                              <label className="block text-[10px] font-bold text-[#0A1428] uppercase">
                                Atribuição Manual de Agente:
                              </label>

                              {eligibleProfessionals.length === 0 ? (
                                <div className="text-[11px] text-[#3D4757] italic">
                                  Nenhum profissional disponível no momento.
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {(() => {
                                    const selectedProId = selectedProForReq[req.id];
                                    const selectedPro = eligibleProfessionals.find(p => p.id === selectedProId);

                                    return (
                                      <FullscreenSelectTrigger
                                        label={selectedPro ? selectedPro.name : 'Selecione um profissional...'}
                                        value={selectedProId || null}
                                        placeholder="Toque para selecionar agente tático..."
                                        badge={selectedPro ? (selectedPro.phone || 'Selecionado') : undefined}
                                        icon={<Shield className="w-3.5 h-3.5 text-[#0A1428]" />}
                                        onClick={() => setProSelectorReqId(req.id)}
                                        theme="light"
                                        className="!py-2 !px-2.5 !text-[11px]"
                                      />
                                    );
                                  })()}

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAssignClick(req.id)}
                                      className="flex-1 btn-yellow !py-1.5 !px-2 text-[11px]"
                                    >
                                      Atribuir Agente
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => cancelServiceRequest(req.id)}
                                      className="btn-outline-navy !text-[#DC2626] !border-[#DC2626] !py-1.5 !px-2 text-[11px]"
                                      title="Cancelar Pedido"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {req.status === 'Atribuído' && (
                            <div className="pt-1.5 border-t border-[#DDE1E8] flex justify-end">
                              <button
                                type="button"
                                onClick={() => cancelServiceRequest(req.id)}
                                className="text-[11px] text-[#DC2626] hover:underline font-semibold cursor-pointer"
                              >
                                Cancelar Chamado
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA: CATÁLOGO DE SERVIÇOS */}
      {activeTab === 'servicos' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#3D4757]">
              Gerenciamento do catálogo de serviços oferecidos pela TRANSEG.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateServiceModal(true)}
              className="btn-yellow"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Serviço</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminServices.map((service) => (
              <div key={service.id} className="card-transeg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#0A1428] text-[#FFC20E] flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0A1428]">{service.name}</h4>
                      <span className="text-[10px] bg-[#DDE1E8] px-1.5 rounded">{service.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleAdminServiceActive(service.id)} className="p-1.5 hover:bg-gray-100 rounded">
                      {service.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => deleteAdminService(service.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#3D4757] line-clamp-2">{service.description}</p>
                <div className="text-[11px] font-mono grid grid-cols-2 gap-2 text-[#3D4757]">
                   <span>Base: R${service.basePrice.toFixed(2)}</span>
                   <span>Hora: R${service.hourlyRate.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: PROFISSIONAIS */}
      {activeTab === 'profissionais' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#3D4757]">
              Gestão de credenciais, homologação cadastral e disponibilidade operacional.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateProModal(true)}
              className="btn-yellow"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Profissional</span>
            </button>
          </div>

          <div className="card-transeg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F4F6] text-[#3D4757] uppercase text-[10px] tracking-wider border-b border-[#DDE1E8] font-display font-semibold">
                  <tr>
                    <th className="p-3.5">Profissional</th>
                    <th className="p-3.5">Contato</th>
                    <th className="p-3.5">Homologação</th>
                    <th className="p-3.5">Disponibilidade</th>
                    <th className="p-3.5">Posição GPS</th>
                    <th className="p-3.5 text-right">Ações Administrativas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE1E8] font-body">
                  {professionals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#8E9BAE]">
                        Nenhum profissional cadastrado no sistema.
                      </td>
                    </tr>
                  ) : (
                    professionals.map((pro) => (
                      <tr key={pro.id} className="hover:bg-[#F3F4F6]/60 transition-colors">
                        <td className="p-3.5 font-medium text-[#0A1428]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#0A1428] text-white flex items-center justify-center font-bold text-xs">
                              {pro.name.charAt(0)}
                            </div>
                            <div>
                              <span className="block font-bold text-[#0A1428]">{pro.name}</span>
                              <span className="text-[10px] text-[#8E9BAE] font-mono">ID: {pro.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-[#3D4757]">
                          <div>{pro.email}</div>
                          <div className="text-[11px] text-[#8E9BAE]">{pro.phone}</div>
                        </td>

                        <td className="p-3.5">
                          {pro.aprovado ? (
                            <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aprovado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#3D4757] font-semibold text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-[#FFC20E]" />
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold ${
                              pro.disponivel
                                ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                                : 'bg-[#F3F4F6] text-[#3D4757] border border-[#DDE1E8]'
                            }`}
                          >
                            {pro.disponivel ? 'Disponível' : 'Indisponível'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {pro.latitude && pro.longitude ? (
                            <div className="space-y-0.5">
                              <span className="font-mono text-[11px] text-[#0A1428] font-semibold">
                                {Number(pro.latitude).toFixed(4)}, {Number(pro.longitude).toFixed(4)}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-[#8E9BAE]">
                                <a
                                  href={`https://www.google.com/maps?q=${pro.latitude},${pro.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#0A1428] font-semibold hover:underline"
                                >
                                  Ver no Mapa
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#8E9BAE] italic">Sem sinal GPS</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right space-x-2">
                          {!pro.aprovado ? (
                            <button
                              type="button"
                              onClick={() => approveProfessional(pro.id)}
                              className="btn-yellow !py-1 !px-3 text-[11px]"
                            >
                              Aprovar Cadastro
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleProfessionalActive(pro.id)}
                              className={`px-3 py-1 rounded-[6px] font-bold text-[11px] uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                                pro.ativo
                                  ? 'bg-emerald-50 text-[#16A34A] border border-emerald-300 hover:bg-red-50 hover:text-[#DC2626] hover:border-red-300'
                                  : 'bg-red-50 text-[#DC2626] border border-red-300 hover:bg-emerald-50 hover:text-[#16A34A]'
                              }`}
                            >
                              {pro.ativo ? 'Conta Ativa' : 'Desativada'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA O ADMIN CADASTRAR PROFISSIONAL */}
      {showCreateProModal && (
        <div className="fixed inset-0 z-50 bg-[#060D1B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE1E8] rounded-[12px] max-w-md w-full p-6 shadow-2xl space-y-4 text-left animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#DDE1E8] pb-3">
              <h3 className="font-display font-bold text-base text-[#0A1428] uppercase">
                Cadastrar Profissional Homologado
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateProModal(false)}
                className="w-8 h-8 rounded-[8px] bg-[#F3F4F6] text-[#3D4757] hover:text-[#0A1428] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createProError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-[6px] text-xs text-[#DC2626]">
                {createProError}
              </div>
            )}

            {createProSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[6px] text-xs text-[#16A34A]">
                {createProSuccess}
              </div>
            )}

            <form onSubmit={handleAdminCreateProSubmit} className="space-y-3 text-xs font-body">
              <div>
                <label className="block text-[#0A1428] font-semibold mb-1">Nome Completo do Profissional:</label>
                <input
                  type="text"
                  required
                  value={newProName}
                  onChange={(e) => setNewProName(e.target.value)}
                  placeholder="Ex: Valdir Rodrigues"
                  className="w-full bg-white border border-[#DDE1E8] focus:border-[#0A1428] rounded-[6px] px-3 py-2 text-[#0A1428] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#0A1428] font-semibold mb-1">E-mail de Acesso:</label>
                <input
                  type="email"
                  required
                  value={newProEmail}
                  onChange={(e) => setNewProEmail(e.target.value)}
                  placeholder="valdir@transeg.com.br"
                  className="w-full bg-white border border-[#DDE1E8] focus:border-[#0A1428] rounded-[6px] px-3 py-2 text-[#0A1428] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#0A1428] font-semibold mb-1">Telefone (com DDD):</label>
                <input
                  type="tel"
                  required
                  value={newProPhone}
                  onChange={(e) => setNewProPhone(e.target.value)}
                  placeholder="(27) 99888-7766"
                  className="w-full bg-white border border-[#DDE1E8] focus:border-[#0A1428] rounded-[6px] px-3 py-2 text-[#0A1428] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#0A1428] font-semibold mb-1">Senha Inicial de Acesso:</label>
                <input
                  type="password"
                  value={newProPassword}
                  onChange={(e) => setNewProPassword(e.target.value)}
                  placeholder="Padrão: senha123"
                  className="w-full bg-white border border-[#DDE1E8] focus:border-[#0A1428] rounded-[6px] px-3 py-2 text-[#0A1428] focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-[#16A34A] pt-1">
                * O profissional cadastrado por esta central entrará diretamente como <strong>Aprovado</strong> e <strong>Ativo</strong>.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DDE1E8]">
                <button
                  type="button"
                  onClick={() => setShowCreateProModal(false)}
                  className="btn-outline-navy !py-2 !px-4 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-yellow !py-2 !px-4 text-xs"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 3: CLIENTES */}
      {activeTab === 'clientes' && (
        <div className="space-y-4">
          <p className="text-xs text-[#3D4757]">
            Tabela cadastral de clientes corporativos e particulares.
          </p>

          <div className="card-transeg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#F3F4F6] text-[#3D4757] uppercase text-[10px] tracking-wider border-b border-[#DDE1E8] font-display font-semibold">
                  <tr>
                    <th className="p-3.5">Nome do Cliente</th>
                    <th className="p-3.5">E-mail</th>
                    <th className="p-3.5">Telefone</th>
                    <th className="p-3.5">Quantidade de Pedidos</th>
                    <th className="p-3.5">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE1E8]">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8E9BAE]">
                        Nenhum cliente cadastrado no momento.
                      </td>
                    </tr>
                  ) : (
                    clients.map((cli) => {
                      const clientOrdersCount = allRequests.filter(r => r.client.id === cli.id).length;
                      return (
                        <tr key={cli.id} className="hover:bg-[#F3F4F6]/60 transition-colors">
                          <td className="p-3.5 font-bold text-[#0A1428]">{cli.name}</td>
                          <td className="p-3.5 text-[#3D4757]">{cli.email}</td>
                          <td className="p-3.5 text-[#3D4757]">{cli.phone}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 bg-[#F3F4F6] border border-[#DDE1E8] rounded-[4px] font-bold text-[#0A1428]">
                              {clientOrdersCount} {clientOrdersCount === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#8E9BAE] font-mono">
                            {new Date(cli.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: HISTÓRICO COMPLETO DE ALERTAS DE PÂNICO */}
      {activeTab === 'alertas' && (
        <div className="space-y-4">
          <p className="text-xs text-[#3D4757]">
            Auditoria completa de todos os alertas de pânico e ocorrências graves disparadas.
          </p>

          <div className="card-transeg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-body">
                <thead className="bg-[#F3F4F6] text-[#3D4757] uppercase text-[10px] tracking-wider border-b border-[#DDE1E8] font-display font-semibold">
                  <tr>
                    <th className="p-3.5">Horário / Data</th>
                    <th className="p-3.5">Chamado</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Endereço da Emergência</th>
                    <th className="p-3.5">Profissional</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE1E8]">
                  {panicAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[#8E9BAE] italic">
                        Nenhum alerta de emergência registrado no sistema.
                      </td>
                    </tr>
                  ) : (
                    panicAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-[#F3F4F6]/60 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-[#0A1428]">
                          {new Date(alert.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5 font-bold text-[#0A1428]">
                          {alert.requestCode}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-[#0A1428] block">{alert.clientName}</span>
                          <a href={`tel:${alert.clientPhone}`} className="text-[11px] text-[#8E9BAE] hover:underline">
                            {alert.clientPhone}
                          </a>
                        </td>
                        <td className="p-3.5 text-[#3D4757] max-w-xs truncate">
                          {alert.address}
                        </td>
                        <td className="p-3.5 text-[#3D4757]">
                          {alert.professionalName || <span className="text-[#8E9BAE] italic">Não designado</span>}
                        </td>
                        <td className="p-3.5">
                          {alert.resolved ? (
                            <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolvido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#DC2626] font-bold text-[11px] animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              ATIVO
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {!alert.resolved && (
                            <button
                              type="button"
                              onClick={() => resolvePanicAlert(alert.id)}
                              className="px-3 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-[11px] uppercase rounded-[6px] cursor-pointer"
                            >
                              Resolver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: RELATÓRIO OPERACIONAL */}
      {activeTab === 'relatorio' && (
        <div className="space-y-6">
          <p className="text-xs text-[#3D4757]">
            Indicadores sintéticos de demanda da frota e distribuição de pedidos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Contagem por Status */}
            <div className="card-transeg p-6 space-y-4">
              <h4 className="font-display font-bold text-sm text-[#0A1428] uppercase tracking-wider border-b border-[#DDE1E8] pb-2">
                Pedidos por Status Operacional
              </h4>

              <div className="space-y-3 text-xs font-body">
                {ORDERED_SERVICE_STATUSES.map((status) => {
                  const count = allRequests.filter(r => r.status === status).length;
                  const total = allRequests.length || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#0A1428]">{status}</span>
                        <span className="text-[#3D4757] font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F3F4F6] rounded-[3px] h-2.5 overflow-hidden border border-[#DDE1E8]">
                        <div
                          className="h-full bg-[#FFC20E] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Contagem por Tipo de Serviço */}
            <div className="card-transeg p-6 space-y-4">
              <h4 className="font-display font-bold text-sm text-[#0A1428] uppercase tracking-wider border-b border-[#DDE1E8] pb-2">
                Pedidos por Tipo de Serviço
              </h4>

              <div className="space-y-3 text-xs font-body">
                {ALL_SERVICE_TYPES.map((type) => {
                  const count = allRequests.filter(r => r.serviceType === type).length;
                  const total = allRequests.length || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#0A1428] truncate max-w-[220px]">
                          {type}
                        </span>
                        <span className="text-[#3D4757] font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F3F4F6] rounded-[3px] h-2.5 overflow-hidden border border-[#DDE1E8]">
                        <div
                          className="h-full bg-[#0A1428] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FULLSCREEN: SELEÇÃO DE AGENTE OPERACIONAL COM GRADIENTE E GLASSMORPHISM */}
      <FullscreenSelectModal
        isOpen={Boolean(proSelectorReqId)}
        onClose={() => setProSelectorReqId(null)}
        title="SELECIONAR AGENTE TÁTICO"
        subtitle={
          proSelectorReqId
            ? `Atribuição para o chamado ${
                allRequests.find((r) => r.id === proSelectorReqId)?.code || ''
              } — ${
                allRequests.find((r) => r.id === proSelectorReqId)?.serviceType || ''
              }`
            : 'Selecione o profissional para atendimento deste chamado'
        }
        eyebrow="CENTRAL DE CONTROLE OPERACIONAL · CCO"
        options={proSelectorOptions}
        selectedValue={proSelectorReqId ? selectedProForReq[proSelectorReqId] : undefined}
        onSelect={(proId) => {
          if (proSelectorReqId) {
            setSelectedProForReq((prev) => ({
              ...prev,
              [proSelectorReqId]: proId,
            }));
          }
        }}
        searchable={true}
        searchPlaceholder="Filtrar por nome ou telefone do agente..."
        emptyMessage="Nenhum profissional disponível encontrado no momento."
      />

    </div>
  );
};
