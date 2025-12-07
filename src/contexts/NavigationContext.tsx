import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface NavigationContextValue {
  // Active modals tracking
  activeModals: Set<string>;
  registerModal: (id: string) => void;
  unregisterModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  hasAnyModalOpen: () => boolean;

  // Navigation lock (e.g., during combat, critical operations)
  isNavigationLocked: boolean;
  lockNavigation: () => void;
  unlockNavigation: () => void;

  // Active overlays (chat, sidebars, etc.)
  activeOverlays: Set<string>;
  registerOverlay: (id: string) => void;
  unregisterOverlay: (id: string) => void;
  isOverlayOpen: (id: string) => boolean;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

/**
 * NavigationProvider
 *
 * Provides centralized navigation state management:
 * - Tracks active modals and overlays
 * - Manages navigation locks (e.g., during combat)
 * - Prevents conflicting UI states
 * - Enables better modal/overlay coordination
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activeModals, setActiveModals] = useState<Set<string>>(new Set());
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());
  const [isNavigationLocked, setIsNavigationLocked] = useState(false);

  // Modal management
  const registerModal = useCallback((id: string) => {
    setActiveModals((prev) => new Set(prev).add(id));
  }, []);

  const unregisterModal = useCallback((id: string) => {
    setActiveModals((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isModalOpen = useCallback(
    (id: string) => {
      return activeModals.has(id);
    },
    [activeModals]
  );

  const hasAnyModalOpen = useCallback(() => {
    return activeModals.size > 0;
  }, [activeModals]);

  // Overlay management
  const registerOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => new Set(prev).add(id));
  }, []);

  const unregisterOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isOverlayOpen = useCallback(
    (id: string) => {
      return activeOverlays.has(id);
    },
    [activeOverlays]
  );

  // Navigation lock management
  const lockNavigation = useCallback(() => {
    setIsNavigationLocked(true);
  }, []);

  const unlockNavigation = useCallback(() => {
    setIsNavigationLocked(false);
  }, []);

  const value: NavigationContextValue = {
    activeModals,
    registerModal,
    unregisterModal,
    isModalOpen,
    hasAnyModalOpen,
    isNavigationLocked,
    lockNavigation,
    unlockNavigation,
    activeOverlays,
    registerOverlay,
    unregisterOverlay,
    isOverlayOpen,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

/**
 * useNavigation Hook
 *
 * Access navigation context state and methods
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}

export default NavigationContext;
