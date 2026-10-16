import { useState, useEffect, useRef, useCallback } from 'react';
import { updateProfessionalLocationInSupabase } from '../lib/supabase';

export interface ProfessionalLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
  formattedTime?: string;
}

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'unknown';

export interface UseProfessionalGeolocationOptions {
  /** ID do profissional no TRANSEG (ex: ID da conta ou perfil) */
  professionalId?: string | null;
  /** Se o rastreamento periódico deve estar habilitado */
  enabled?: boolean;
  /** Intervalo em milissegundos para sincronização periódica no Supabase (padrão: 15.000 ms = 15s) */
  intervalMs?: number;
  /** Se deve sincronizar com o banco Supabase automaticamente */
  syncToSupabase?: boolean;
  /** Alta precisão de GPS (enableHighAccuracy) */
  highAccuracy?: boolean;
  /** Timeout para aquisição de posição em ms (padrão: 10.000 ms) */
  timeoutMs?: number;
  /** Idade máxima de cache do GPS em ms (padrão: 5.000 ms) */
  maximumAgeMs?: number;
  /** Callback opcional acionado a cada nova posição */
  onLocationUpdate?: (location: ProfessionalLocation) => void;
  /** Callback opcional acionado quando houver erro */
  onError?: (errorMessage: string, code?: string) => void;
}

export interface UseProfessionalGeolocationResult {
  /** Se a API de Geolocalização do navegador é suportada */
  isSupported: boolean;
  /** Se o rastreamento periódico está ativo no momento */
  isTracking: boolean;
  /** Se uma sincronização com o Supabase está ocorrendo */
  isSyncing: boolean;
  /** Dados da última localização obtida via GPS */
  location: ProfessionalLocation | null;
  /** Data/Hora da última sincronização bem-sucedida com o Supabase */
  lastSyncedAt: Date | null;
  /** Mensagem de erro amigável, se houver */
  error: string | null;
  /** Código técnico do erro */
  errorCode: string | null;
  /** Status da permissão de localização do navegador */
  permissionStatus: GeolocationPermissionState;
  /** Iniciar ou reiniciar rastreamento contínuo */
  startTracking: () => void;
  /** Interromper rastreamento contínuo */
  stopTracking: () => void;
  /** Forçar leitura do GPS e atualização imediata no Supabase */
  forceUpdateLocation: () => Promise<ProfessionalLocation | null>;
  /** Simulação para demonstração / testes em ambientes sem GPS físico */
  simulateLocation: (customCoords?: { latitude: number; longitude: number }) => Promise<ProfessionalLocation>;
  /** Limpar erros atuais */
  clearError: () => void;
}

/**
 * Hook customizado de alta precisão que utiliza a Geolocation API do navegador
 * para capturar e atualizar periodicamente a localização do profissional no Supabase.
 */
export function useProfessionalGeolocation(
  options: UseProfessionalGeolocationOptions = {}
): UseProfessionalGeolocationResult {
  const {
    professionalId,
    enabled = true,
    intervalMs = 15000, // 15 segundos por padrão
    syncToSupabase = true,
    highAccuracy = true,
    timeoutMs = 10000,
    maximumAgeMs = 5000,
    onLocationUpdate,
    onError,
  } = options;

  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [location, setLocation] = useState<ProfessionalLocation | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<GeolocationPermissionState>('unknown');

  // Referências para controle de timers e watchers sem memory leak
  const watchIdRef = useRef<number | null>(null);
  const intervalTimerRef = useRef<number | null>(null);
  const lastDispatchedLocationRef = useRef<ProfessionalLocation | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Monitorar permissões do navegador se Permissions API estiver disponível
  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      let isMounted = true;
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permission) => {
          if (!isMounted) return;
          setPermissionStatus(permission.state as GeolocationPermissionState);

          permission.onchange = () => {
            if (!isMounted) return;
            setPermissionStatus(permission.state as GeolocationPermissionState);
          };
        })
        .catch(() => {
          if (isMounted) setPermissionStatus('unknown');
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isSupported]);

  /**
   * Envia os dados de coordenadas ao Supabase
   */
  const syncLocationToSupabase = useCallback(
    async (loc: ProfessionalLocation) => {
      if (!syncToSupabase || !professionalId) return;
      if (isSyncingRef.current) return;

      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        const res = await updateProfessionalLocationInSupabase(professionalId, {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          heading: loc.heading ?? null,
          speed: loc.speed ?? null,
        });

        if (res.success) {
          setLastSyncedAt(new Date());
          lastDispatchedLocationRef.current = loc;
        } else if (res.error) {
          console.warn('[Geolocation Hook] Aviso ao salvar no Supabase:', res.error);
        }
      } catch (err: any) {
        console.warn('[Geolocation Hook] Erro de rede ao sincronizar:', err?.message);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [syncToSupabase, professionalId]
  );

  /**
   * Trata uma nova posição adquirida via GPS
   */
  const handlePositionSuccess = useCallback(
    (position: GeolocationPosition) => {
      const coords = position.coords;
      const newLoc: ProfessionalLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        speed: coords.speed,
        heading: coords.heading,
        timestamp: position.timestamp,
        formattedTime: new Date(position.timestamp).toLocaleTimeString(),
      };

      setLocation(newLoc);
      setError(null);
      setErrorCode(null);

      if (onLocationUpdate) {
        onLocationUpdate(newLoc);
      }

      // Sincronizar com o Supabase
      syncLocationToSupabase(newLoc);
    },
    [onLocationUpdate, syncLocationToSupabase]
  );

  /**
   * Trata erros da Geolocation API
   */
  const handlePositionError = useCallback(
    (err: GeolocationPositionError) => {
      let friendlyMsg = 'Não foi possível obter a localização do dispositivo.';
      let code = 'UNKNOWN_ERROR';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          friendlyMsg = 'Permissão de GPS negada. Habilite o acesso à localização no seu navegador.';
          code = 'PERMISSION_DENIED';
          setPermissionStatus('denied');
          break;
        case err.POSITION_UNAVAILABLE:
          friendlyMsg = 'Sinal de GPS indisponível no momento. Verifique a conexão do dispositivo.';
          code = 'POSITION_UNAVAILABLE';
          break;
        case err.TIMEOUT:
          friendlyMsg = 'Tempo limite excedido ao requisitar coordenadas do GPS.';
          code = 'TIMEOUT';
          break;
      }

      setError(friendlyMsg);
      setErrorCode(code);

      if (onError) {
        onError(friendlyMsg, code);
      }
    },
    [onError]
  );

  /**
   * Lê a posição atual imediatamente via getCurrentPosition
   */
  const fetchCurrentPosition = useCallback((): Promise<ProfessionalLocation | null> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        setError('A API de geolocalização não é suportada por este navegador.');
        setErrorCode('UNSUPPORTED');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          const coords = pos.coords;
          const loc: ProfessionalLocation = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            speed: coords.speed,
            heading: coords.heading,
            timestamp: pos.timestamp,
            formattedTime: new Date(pos.timestamp).toLocaleTimeString(),
          };
          resolve(loc);
        },
        (err) => {
          handlePositionError(err);
          resolve(null);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: maximumAgeMs,
        }
      );
    });
  }, [isSupported, handlePositionSuccess, handlePositionError, highAccuracy, timeoutMs, maximumAgeMs]);

  /**
   * Inicia o monitoramento contínuo (watchPosition + heartbeat periódico)
   */
  const startTracking = useCallback(() => {
    if (!isSupported) {
      setError('A API de geolocalização não é suportada por este navegador.');
      return;
    }

    setIsTracking(true);
    setError(null);

    // 1. Obter posição inicial imediatamente
    fetchCurrentPosition();

    // 2. Iniciar watchPosition para escutar alterações de movimento
    if (watchIdRef.current === null) {
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionSuccess,
          handlePositionError,
          {
            enableHighAccuracy: highAccuracy,
            timeout: timeoutMs,
            maximumAge: maximumAgeMs,
          }
        );
      } catch (e: any) {
        console.warn('[Geolocation Hook] Erro ao iniciar watchPosition:', e);
      }
    }

    // 3. Iniciar heartbeat periódico para garantir sincronização periódica no Supabase
    if (intervalTimerRef.current === null && intervalMs > 0) {
      intervalTimerRef.current = window.setInterval(() => {
        fetchCurrentPosition();
      }, intervalMs);
    }
  }, [
    isSupported,
    fetchCurrentPosition,
    handlePositionSuccess,
    handlePositionError,
    highAccuracy,
    timeoutMs,
    maximumAgeMs,
    intervalMs,
  ]);

  /**
   * Para o monitoramento
   */
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalTimerRef.current !== null) {
      window.clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
  }, []);

  /**
   * Forçar atualização manual
   */
  const forceUpdateLocation = useCallback(async (): Promise<ProfessionalLocation | null> => {
    return await fetchCurrentPosition();
  }, [fetchCurrentPosition]);

  /**
   * Função utilitária para testes/demonstração operacional (ex: ambiente de homologação ou desktop)
   */
  const simulateLocation = useCallback(
    async (customCoords?: { latitude: number; longitude: number }): Promise<ProfessionalLocation> => {
      // Coordenadas padrão da central operacional TRANSEG (Vitória / Grande Vitória - ES)
      const baseLat = customCoords?.latitude ?? -20.3155;
      const baseLng = customCoords?.longitude ?? -40.3128;
      // Adicionar leve variação para simular deslocamento
      const jitterLat = (Math.random() - 0.5) * 0.002;
      const jitterLng = (Math.random() - 0.5) * 0.002;

      const simLoc: ProfessionalLocation = {
        latitude: Number((baseLat + jitterLat).toFixed(6)),
        longitude: Number((baseLng + jitterLng).toFixed(6)),
        accuracy: 12.5,
        speed: 8.3, // ~30 km/h
        heading: 180,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString(),
      };

      setLocation(simLoc);
      setError(null);
      setErrorCode(null);

      if (onLocationUpdate) {
        onLocationUpdate(simLoc);
      }

      await syncLocationToSupabase(simLoc);
      return simLoc;
    },
    [onLocationUpdate, syncLocationToSupabase]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  // Efeito principal para controlar ciclo de vida automático baseado na prop 'enabled'
  useEffect(() => {
    if (enabled && professionalId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, professionalId, startTracking, stopTracking]);

  return {
    isSupported,
    isTracking,
    isSyncing,
    location,
    lastSyncedAt,
    error,
    errorCode,
    permissionStatus,
    startTracking,
    stopTracking,
    forceUpdateLocation,
    simulateLocation,
    clearError,
  };
}
