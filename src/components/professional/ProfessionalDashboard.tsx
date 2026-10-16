import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  PhoneCall, 
  AlertCircle, 
  MapPin, 
  Zap, 
  Calendar, 
  Lock, 
  Radio, 
  Crosshair, 
  RefreshCw, 
  Signal, 
  ExternalLink, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { SectionHeader } from '../common/SectionHeader';
import { useProfessionalGeolocation } from '../../hooks/useProfessionalGeolocation';

export const ProfessionalDashboard: React.FC = () => {
  const { 
    currentUser, 
    myRequests, 
    professionals, 
    toggleMyAvailability, 
    acceptAssignedRequest, 
    declineAssignedRequest, 
    advanceRequestStatus,
    updateProfessionalLocation
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chamados' | 'historico'>('chamados');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Find professional entity in database
  const myProfile = professionals.find(p => p.id === currentUser?.id);

  // Hook de Geolocalização do Navegador + Sincronização Periódica com o Supabase
  const {
    isSupported: isGpsSupported,
    isTracking: isGpsTracking,
    isSyncing: isGpsSyncing,
    location: currentGpsLocation,
    lastSyncedAt: lastGpsSync,
    error: gpsError,
    errorCode: gpsErrorCode,
    startTracking: startGpsTracking,
    forceUpdateLocation: forceGpsUpdate,
    simulateLocation: simulateGpsLocation,
    clearError: clearGpsError,
  } = useProfessionalGeolocation({
    professionalId: currentUser?.id,
    enabled: Boolean(myProfile?.aprovado && myProfile?.ativo && myProfile?.disponivel),
    intervalMs: 15000,
    syncToSupabase: true,
    highAccuracy: true,
    onLocationUpdate: (loc) => {
      updateProfessionalLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        heading: loc.heading,
        speed: loc.speed,
      });
    },
  });

  // Active missions assigned to this professional (Atribuído, A caminho, Em andamento)
  const activeMissions = myRequests.filter(r => 
    r.status === 'Atribuído' || 
    r.status === 'A caminho' || 
    r.status === 'Em andamento'
  );

  // Completed missions
  const completedMissions = myRequests.filter(r => r.status === 'Concluído');

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleAccept = (reqId: string) => {
    const res = acceptAssignedRequest(reqId);
    if (res.success) {
      showNotification(res.message || 'Chamado aceito com sucesso!');
    }
  };

  const handleDecline = (reqId: string) => {
    if (confirm('Deseja recusar este chamado? Ele retornará à central CCO para reatribuição.')) {
      const res = declineAssignedRequest(reqId);
      if (res.success) {
        showNotification(res.message || 'Chamado recusado.');
      }
    }
  };

  const handleAdvance = (reqId: string) => {
    const res = advanceRequestStatus(reqId);
    if (res.success) {
      showNotification(res.message || 'Status operacional atualizado.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-6 font-body text-[#3D4757]">
      <SectionHeader
        title="Painel do Profissional"
        subtitle="Gerencie seus chamados operacionais e atualizações de status em tempo real."
        lightBg={true}
      />

      {/* FEEDBACK BANNER */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] text-xs text-[#16A34A] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 1. SE CONTA NÃO APROVADA: AVISO CLARO */}
      {!myProfile?.aprovado || !myProfile?.ativo ? (
        <div className="card-transeg p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-[#F3F4F6] border border-[#DDE1E8] rounded-full flex items-center justify-center mx-auto text-[#0A1428]">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-[#0A1428] tracking-wide">
              Cadastro Aguardando Homologação CCO
            </h3>
            <p className="text-xs text-[#3D4757] max-w-md mx-auto mt-2 leading-relaxed">
              Sua conta de profissional está sob análise cadastral pela Central de Controle Operacional (CCO). 
              Você receberá chamados após a ativação do seu perfil pelo administrador.
            </p>
          </div>

          <div className="p-4 bg-[#F3F4F6] rounded-[8px] border border-[#DDE1E8] max-w-sm mx-auto text-left text-xs space-y-2 text-[#3D4757]">
            <div className="flex items-center justify-between">
              <span>Status Cadastral:</span>
              <span className="font-semibold text-[#0A1428] uppercase">Pendente</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Disponibilidade:</span>
              <span>Bloqueada até aprovação</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Protocolo CCO:</span>
              <span className="font-mono text-[#0A1428] font-bold">#TR-PRO-{myProfile?.id || '004'}</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2. SE APROVADO / ATIVO: CONTROLE DE DISPONIBILIDADE */
        <div className="card-transeg p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-[8px] flex items-center justify-center font-bold text-sm ${
                myProfile.disponivel
                  ? 'bg-[#0A1428] text-[#FFC20E]'
                  : 'bg-[#F3F4F6] text-[#3D4757] border border-[#DDE1E8]'
              }`}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow text-[#0A1428] text-[10px]">
                  STATUS DE PRONTIDÃO:
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${
                    myProfile.disponivel
                      ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                      : 'bg-[#F3F4F6] text-[#3D4757] border border-[#DDE1E8]'
                  }`}
                >
                  {myProfile.disponivel ? 'Disponível' : 'Indisponível'}
                </span>
              </div>
              <p className="text-xs text-[#3D4757] mt-1">
                {myProfile.disponivel
                  ? 'Você está ativo na escala operacional e habilitado para receber chamados.'
                  : 'Você está offline e não receberá novas atribuições de atendimento.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleMyAvailability}
            className={myProfile.disponivel ? 'btn-outline-navy' : 'btn-yellow'}
          >
            <Radio className="w-4 h-4" />
            <span>
              {myProfile.disponivel ? 'Ficar Indisponível' : 'Ficar Disponível'}
            </span>
          </button>
        </div>
      )}

      {/* 2.1 TELEMETRIA GPS E SINCRONIZAÇÃO COM O SUPABASE */}
      {myProfile?.aprovado && myProfile?.ativo && (
        <div className="card-transeg p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE1E8] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[8px] bg-[#0A1428] text-[#FFC20E] flex items-center justify-center shrink-0">
                <Crosshair className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-[#0A1428] uppercase tracking-wide">
                    Telemetria GPS & Rastreamento em Tempo Real
                  </h4>
                  {isGpsTracking && !gpsError && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#3D4757]">
                  Atualização periódica a cada 15 segundos sincronizada com a Central CCO.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isGpsSyncing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#0A1428]/10 text-[#0A1428] text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Sincronizando
                </span>
              )}

              {isGpsTracking && !gpsError && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-emerald-50 border border-emerald-200 text-[#16A34A] text-[10px] font-bold uppercase tracking-wider">
                  <Signal className="w-3 h-3" />
                  GPS Operacional Ativo
                </span>
              )}

              {(!myProfile.disponivel || !isGpsTracking) && !gpsError && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F3F4F6] border border-[#DDE1E8] text-[#3D4757] text-[10px] font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  Transmissão em Espera
                </span>
              )}

              {gpsError && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-red-50 border border-red-200 text-[#DC2626] text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" />
                  Atenção no Sinal GPS
                </span>
              )}
            </div>
          </div>

          {/* ERRO DE GPS */}
          {gpsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-xs text-[#DC2626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  {gpsError} {gpsErrorCode === 'PERMISSION_DENIED' && '(Permissão bloqueada no navegador)'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    clearGpsError();
                    startGpsTracking();
                  }}
                  className="btn-outline-navy !py-1 !px-3 text-xs"
                >
                  Tentar Novamente
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await simulateGpsLocation();
                    showNotification('Posição simulada transmitida com sucesso para o Supabase!');
                  }}
                  className="btn-yellow !py-1 !px-3 text-xs"
                >
                  Simular GPS
                </button>
              </div>
            </div>
          )}

          {/* GRID DE TELEMETRIA GPS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F3F4F6] p-3 rounded-[8px] border border-[#DDE1E8]">
              <span className="block text-[10px] text-[#3D4757] uppercase font-bold tracking-wider">Latitude</span>
              <span className="font-mono text-xs text-[#0A1428] font-bold">
                {currentGpsLocation
                  ? currentGpsLocation.latitude.toFixed(6)
                  : myProfile?.latitude !== null && myProfile?.latitude !== undefined
                  ? Number(myProfile.latitude).toFixed(6)
                  : 'Aguardando GPS'}
              </span>
            </div>

            <div className="bg-[#F3F4F6] p-3 rounded-[8px] border border-[#DDE1E8]">
              <span className="block text-[10px] text-[#3D4757] uppercase font-bold tracking-wider">Longitude</span>
              <span className="font-mono text-xs text-[#0A1428] font-bold">
                {currentGpsLocation
                  ? currentGpsLocation.longitude.toFixed(6)
                  : myProfile?.longitude !== null && myProfile?.longitude !== undefined
                  ? Number(myProfile.longitude).toFixed(6)
                  : 'Aguardando GPS'}
              </span>
            </div>

            <div className="bg-[#F3F4F6] p-3 rounded-[8px] border border-[#DDE1E8]">
              <span className="block text-[10px] text-[#3D4757] uppercase font-bold tracking-wider">Precisão GPS</span>
              <span className="font-mono text-xs text-[#16A34A] font-bold">
                {currentGpsLocation
                  ? `± ${Math.round(currentGpsLocation.accuracy)}m`
                  : myProfile?.accuracy
                  ? `± ${Math.round(myProfile.accuracy)}m`
                  : 'Indisponível'}
              </span>
            </div>

            <div className="bg-[#F3F4F6] p-3 rounded-[8px] border border-[#DDE1E8]">
              <span className="block text-[10px] text-[#3D4757] uppercase font-bold tracking-wider">Último Ping</span>
              <span className="font-mono text-xs text-[#0A1428] font-bold">
                {lastGpsSync
                  ? lastGpsSync.toLocaleTimeString()
                  : myProfile?.lastLocationUpdate
                  ? new Date(myProfile.lastLocationUpdate).toLocaleTimeString()
                  : 'Sem transmissões'}
              </span>
            </div>
          </div>

          {/* BARRA DE AÇÕES DO GPS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2 text-[#3D4757] text-[11px]">
              <Navigation className="w-3.5 h-3.5 text-[#0A1428]" />
              <span>Intervalo: <strong>15 segundos</strong></span>
              <span className="text-[#DDE1E8]">|</span>
              <span>Alta precisão: <strong className="text-[#16A34A]">Ativada</strong></span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(currentGpsLocation || myProfile?.latitude) && (
                <a
                  href={`https://www.google.com/maps?q=${
                    currentGpsLocation?.latitude ?? myProfile?.latitude
                  },${currentGpsLocation?.longitude ?? myProfile?.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-navy !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver no Mapa</span>
                </a>
              )}

              <button
                type="button"
                onClick={async () => {
                  const res = await forceGpsUpdate();
                  if (res) {
                    showNotification(`Coordenadas transmitidas: ${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)}`);
                  } else {
                    showNotification('Falha ao adquirir leitura de GPS.');
                  }
                }}
                disabled={isGpsSyncing}
                className="btn-outline-navy !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGpsSyncing ? 'animate-spin' : ''}`} />
                <span>Atualizar Agora</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const sim = await simulateGpsLocation();
                  showNotification(`Posição simulada enviada (${sim.latitude}, ${sim.longitude})`);
                }}
                className="btn-yellow !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Simular Deslocamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS: CHAMADOS / HISTÓRICO */}
      {myProfile?.aprovado && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('chamados')}
              className={`px-4 py-2 rounded-[8px] font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'chamados'
                  ? 'bg-[#0A1428] text-white'
                  : 'bg-white border border-[#DDE1E8] text-[#3D4757] hover:bg-[#F3F4F6]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Chamados Ativos</span>
              {activeMissions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FFC20E] text-[#060D1B] font-extrabold">
                  {activeMissions.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-2 rounded-[8px] font-display font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'historico'
                  ? 'bg-[#0A1428] text-white'
                  : 'bg-white border border-[#DDE1E8] text-[#3D4757] hover:bg-[#F3F4F6]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Histórico Concluído ({completedMissions.length})</span>
            </button>
          </div>

          {/* TAB 1: CHAMADOS ATIVOS */}
          {activeTab === 'chamados' && (
            <div className="space-y-4">
              {activeMissions.length === 0 ? (
                <div className="card-transeg p-10 text-center space-y-2">
                  <Shield className="w-10 h-10 text-[#8E9BAE] mx-auto" />
                  <h4 className="font-display font-bold text-[#0A1428] text-base">
                    Nenhum Chamado Atribuído no Momento
                  </h4>
                  <p className="text-xs text-[#3D4757]">
                    Assim que a Central CCO atribuir um atendimento ao seu perfil, ele aparecerá aqui com aviso de confirmação.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeMissions.map((mission) => {
                    const isPendingAcceptance = mission.status === 'Atribuído' && !mission.accepted;

                    return (
                      <div
                        key={mission.id}
                        className={`card-transeg p-6 space-y-4 ${
                          isPendingAcceptance 
                            ? 'ring-2 ring-[#FFC20E] border-[#FFC20E]' 
                            : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#DDE1E8] pb-3">
                          <div>
                            <span className="eyebrow text-[#0A1428] block text-[10px]">
                              MISSÃO {mission.code}
                            </span>
                            <h3 className="font-display font-bold text-lg text-[#0A1428] mt-0.5">
                              {mission.serviceType}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={mission.status} size="md" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <span className="text-[#3D4757] block text-[11px] font-medium">Endereço da Operação:</span>
                            <div className="flex items-start gap-1.5 text-[#0A1428] font-semibold">
                              <MapPin className="w-4 h-4 text-[#FFC20E] shrink-0 mt-0.5" />
                              <span>{mission.address}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[#3D4757] block text-[11px] font-medium">Modalidade:</span>
                            <div>
                              {mission.isImmediate ? (
                                <span className="inline-flex items-center gap-1 text-[#0A1428] font-bold">
                                  <Zap className="w-3.5 h-3.5 text-[#FFC20E]" />
                                  Imediato
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#3D4757]">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Agendado: {mission.scheduledDateTime ? new Date(mission.scheduledDateTime).toLocaleString('pt-BR') : 'Data informada'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {mission.observations && (
                          <div className="text-xs bg-[#F3F4F6] p-3 rounded-[8px] border border-[#DDE1E8]">
                            <span className="text-[#3D4757] block text-[10px] font-bold uppercase mb-1 font-display">
                              Observações da Central / Cliente:
                            </span>
                            <p className="text-[#3D4757]">{mission.observations}</p>
                          </div>
                        )}

                        {/* Informações do Cliente se aceito */}
                        {mission.accepted ? (
                          <div className="p-3.5 bg-[#F3F4F6] rounded-[8px] border border-[#DDE1E8] flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#0A1428] text-white flex items-center justify-center font-bold text-xs">
                                {mission.client.name.charAt(0)}
                              </div>
                              <div>
                                <span className="text-[10px] text-[#3D4757] uppercase font-bold block">
                                  Cliente do Atendimento:
                                </span>
                                <span className="text-xs font-bold text-[#0A1428] block">
                                  {mission.client.name}
                                </span>
                              </div>
                            </div>

                            {mission.client.phone && (
                              <a
                                href={`tel:${mission.client.phone.replace(/\D/g, '')}`}
                                className="btn-navy !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Ligar para Cliente</span>
                              </a>
                            )}
                          </div>
                        ) : null}

                        {/* Botões de Ação Operacional */}
                        <div className="pt-3 border-t border-[#DDE1E8] flex flex-wrap items-center justify-end gap-3">
                          {isPendingAcceptance ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDecline(mission.id)}
                                className="btn-outline-navy !py-2 !px-4 text-xs"
                              >
                                Recusar Chamado
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAccept(mission.id)}
                                className="btn-yellow !py-2 !px-4 text-xs"
                              >
                                Aceitar Atendimento
                              </button>
                            </>
                          ) : (
                            <>
                              {mission.status === 'Atribuído' && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvance(mission.id)}
                                  className="btn-yellow !py-2 !px-4 text-xs"
                                >
                                  <Navigation className="w-4 h-4" />
                                  <span>Iniciar Deslocamento (A Caminho)</span>
                                </button>
                              )}

                              {mission.status === 'A caminho' && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvance(mission.id)}
                                  className="btn-yellow !py-2 !px-4 text-xs"
                                >
                                  <Play className="w-4 h-4" />
                                  <span>Cheguei ao Local (Em Andamento)</span>
                                </button>
                              )}

                              {mission.status === 'Em andamento' && (
                                <button
                                  type="button"
                                  onClick={() => handleAdvance(mission.id)}
                                  className="btn-navy !py-2 !px-4 text-xs"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                                  <span>Concluir Missão Operacional</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTÓRICO CONCLUÍDO */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              {completedMissions.length === 0 ? (
                <div className="card-transeg p-10 text-center space-y-2">
                  <Clock className="w-10 h-10 text-[#8E9BAE] mx-auto" />
                  <h4 className="font-display font-bold text-[#0A1428] text-base">
                    Nenhuma Missão Concluída no Histórico
                  </h4>
                  <p className="text-xs text-[#3D4757]">
                    Os chamados finalizados com sucesso ficarão arquivados nesta seção.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedMissions.map((item) => (
                    <div
                      key={item.id}
                      className="card-transeg p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="eyebrow text-[#0A1428] block text-[10px]">
                            {item.code}
                          </span>
                          <h4 className="font-display font-bold text-base text-[#0A1428]">
                            {item.serviceType}
                          </h4>
                        </div>
                        <StatusBadge status="Concluído" size="sm" />
                      </div>

                      <div className="text-xs text-[#3D4757] space-y-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#0A1428] shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>
                        <div className="text-[11px] text-[#3D4757]">
                          Cliente: {item.client.name}
                        </div>
                      </div>

                      <div className="border-t border-[#DDE1E8] pt-2 text-[11px] text-[#3D4757] flex items-center justify-between">
                        <span>Finalizado com sucesso</span>
                        <span className="text-[#16A34A] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          CCO Homologado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
