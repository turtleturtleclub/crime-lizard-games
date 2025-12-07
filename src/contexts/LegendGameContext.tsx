import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { PlayerCharacter } from '../types/legend.types';

interface LegendGameContextType {
    showCharSheet: () => void;
    showInventory: () => void;
    showLeaderboard: () => void;
    showQuestLog: () => void;
    showCharacterCreation: () => void;
    showStatus: () => void;
    // Player state and sync functions
    player: PlayerCharacter | null;
    updatePlayer: (updates: Partial<PlayerCharacter>) => void;
    savePlayerData: () => Promise<void>;
    saveAndChangeLocation: (newLocation: PlayerCharacter['location']) => Promise<void>;
    syncGoldFromBlockchain: () => Promise<void>;
}

const LegendGameContext = createContext<LegendGameContextType | null>(null);

export function LegendGameProvider({ children }: { children: ReactNode }) {
    const [handlers, setHandlers] = useState<LegendGameContextType | null>(null);

    const registerHandlers = useCallback((newHandlers: LegendGameContextType) => {
        setHandlers(newHandlers);
    }, []);

    const contextValue = useMemo(() => ({
        showCharSheet: handlers?.showCharSheet || (() => {}),
        showInventory: handlers?.showInventory || (() => {}),
        showLeaderboard: handlers?.showLeaderboard || (() => {}),
        showQuestLog: handlers?.showQuestLog || (() => {}),
        showCharacterCreation: handlers?.showCharacterCreation || (() => {}),
        showStatus: handlers?.showStatus || (() => {}),
        player: handlers?.player || null,
        updatePlayer: handlers?.updatePlayer || (() => {}),
        savePlayerData: handlers?.savePlayerData || (async () => {}),
        saveAndChangeLocation: handlers?.saveAndChangeLocation || (async () => {}),
        syncGoldFromBlockchain: handlers?.syncGoldFromBlockchain || (async () => {}),
        registerHandlers,
    }), [handlers, registerHandlers]);

    return (
        <LegendGameContext.Provider value={contextValue as any}>
            {children}
        </LegendGameContext.Provider>
    );
}

// Memoize fallback object to prevent infinite re-renders
const DEFAULT_HANDLERS = {
    showCharSheet: () => {},
    showInventory: () => {},
    showLeaderboard: () => {},
    showQuestLog: () => {},
    showCharacterCreation: () => {},
    showStatus: () => {},
    player: null,
    updatePlayer: () => {},
    savePlayerData: async () => {},
    saveAndChangeLocation: async () => {},
    syncGoldFromBlockchain: async () => {},
};

export function useLegendGame() {
    const context = useContext(LegendGameContext);
    return context || DEFAULT_HANDLERS;
}
