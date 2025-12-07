/// <reference types="vite/client" />

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, handler: (...args: any[]) => void) => void;
            removeListener: (event: string, handler: (...args: any[]) => void) => void;
            removeAllListeners: (event: string) => void;
            disconnect?: () => Promise<void>;
            isMetaMask?: boolean;
            selectedAddress?: string | null;
        };
    }
}

export {};
