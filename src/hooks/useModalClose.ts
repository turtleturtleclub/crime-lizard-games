import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle modal closing via ESC key, mobile back button, and keyboard dismissal
 * @param onClose - Callback function to close the modal
 * @param isOpen - Whether the modal is currently open
 */
export const useModalClose = (onClose: () => void, isOpen: boolean = true) => {
    const historyPushedRef = useRef(false);
    const onCloseRef = useRef(onClose);
    const cleanupScheduledRef = useRef(false);

    // Keep onClose ref up to date without causing re-renders
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        // Dismiss keyboard when modal opens (important for mobile)
        // This prevents keyboard from overlaying the modal content
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }

        // Safe close that properly schedules the state update
        const safeClose = () => {
            if (cleanupScheduledRef.current) return; // Prevent double-close
            cleanupScheduledRef.current = true;

            // Mark history as handled immediately
            historyPushedRef.current = false;

            // Use requestAnimationFrame to defer until after current render
            requestAnimationFrame(() => {
                // Then use setTimeout to ensure we're completely out of the event handler
                setTimeout(() => {
                    onCloseRef.current();
                }, 0);
            });
        };

        // Handle ESC key
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                safeClose();
            }
        };

        // Handle mobile back button (popstate event)
        const handlePopState = (event: PopStateEvent) => {
            // Only handle if we pushed the state
            if (historyPushedRef.current) {
                event.preventDefault();
                event.stopPropagation();
                safeClose();
            }
        };

        // Add event listeners
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('popstate', handlePopState);

        // Push a state to the history stack when modal opens
        // This allows the back button to close the modal
        window.history.pushState({ modalOpen: true }, '');
        historyPushedRef.current = true;

        // Cleanup function
        return () => {
            document.removeEventListener('keydown', handleEscape);
            window.removeEventListener('popstate', handlePopState);

            // Only clean up history if we haven't already handled the event
            if (historyPushedRef.current) {
                try {
                    // Check if the state is still our modal state before replacing
                    if (window.history.state?.modalOpen) {
                        window.history.replaceState(null, '');
                    }
                } catch (e) {
                    // Ignore errors during cleanup (e.g., if navigation already happened)
                }
                historyPushedRef.current = false;
            }
            cleanupScheduledRef.current = false;
        };
    }, [isOpen]); // Only depend on isOpen, not onClose
};
