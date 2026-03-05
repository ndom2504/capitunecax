import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CapiSession, CapiMotif, CapiProfileData,
  CapiEvaluation, CapiService, CapiTimelineStep, CapiAdvisor, AutonomieProject,
} from '../lib/api';

const STORAGE_KEY = 'capi_session_v2';

interface CapiContextValue {
  session: CapiSession;
  updateSession: (patch: Partial<CapiSession>) => void;
  resetSession: () => void;
  goToStep: (step: number) => void;
}

const DEFAULT_SESSION: CapiSession = { step: 1 };

const CapiContext = createContext<CapiContextValue>({
  session: DEFAULT_SESSION,
  updateSession: () => {},
  resetSession: () => {},
  goToStep: () => {},
});

export function CapiProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CapiSession>(DEFAULT_SESSION);

  // Restaure la session au démarrage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as CapiSession;
          setSession(saved);
        } catch { /* session corrompue → on ignore */ }
      }
    });
  }, []);

  const updateSession = useCallback((patch: Partial<CapiSession>) => {
    setSession(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const goToStep = useCallback((step: number) => {
    setSession(prev => {
      const next = { ...prev, step };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <CapiContext.Provider value={{ session, updateSession, resetSession, goToStep }}>
      {children}
    </CapiContext.Provider>
  );
}

export function useCapiSession() {
  return useContext(CapiContext);
}
