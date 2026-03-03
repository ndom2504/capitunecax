import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  CapiSession, CapiMotif, CapiProfileData,
  CapiEvaluation, CapiService, CapiTimelineStep, CapiAdvisor,
} from '../lib/api';

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

  const updateSession = useCallback((patch: Partial<CapiSession>) => {
    setSession(prev => ({ ...prev, ...patch }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(DEFAULT_SESSION);
  }, []);

  const goToStep = useCallback((step: number) => {
    setSession(prev => ({ ...prev, step }));
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
