import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ImpersonationTarget {
  type: 'tenant_admin' | 'member';
  tenantId: string;
  tenantName: string;
  memberId?: string;
  memberName?: string;
}

interface ImpersonationContextValue {
  isImpersonating: boolean;
  target: ImpersonationTarget | null;
  startImpersonation: (target: ImpersonationTarget) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ImpersonationTarget | null>(null);

  const startImpersonation = useCallback((newTarget: ImpersonationTarget) => {
    setTarget(newTarget);
    // Store in session for navigation persistence
    sessionStorage.setItem('impersonation', JSON.stringify(newTarget));
  }, []);

  const stopImpersonation = useCallback(() => {
    setTarget(null);
    sessionStorage.removeItem('impersonation');
  }, []);

  // Restore from session on mount
  useState(() => {
    const stored = sessionStorage.getItem('impersonation');
    if (stored) {
      try {
        setTarget(JSON.parse(stored));
      } catch (e) {
        sessionStorage.removeItem('impersonation');
      }
    }
  });

  return (
    <ImpersonationContext.Provider value={{
      isImpersonating: !!target,
      target,
      startImpersonation,
      stopImpersonation
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
