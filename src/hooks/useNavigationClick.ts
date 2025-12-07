import { useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

/**
 * useNavigationClick Hook
 *
 * Provides a standardized way to handle navigation clicks
 * that respects navigation locks and prevents conflicts
 *
 * @returns Object with navigation-aware click handler utilities
 */
export function useNavigationClick() {
  const { isNavigationLocked } = useNavigation();

  /**
   * Wraps a click handler with navigation lock checking
   * and automatic event stopping
   */
  const createClickHandler = useCallback(
    (handler: (e: React.MouseEvent) => void, options?: { stopPropagation?: boolean; preventDefault?: boolean }) => {
      return (e: React.MouseEvent) => {
        if (isNavigationLocked) {
return;
        }

        if (options?.stopPropagation !== false) {
          e.stopPropagation();
        }

        if (options?.preventDefault) {
          e.preventDefault();
        }

        handler(e);
      };
    },
    [isNavigationLocked]
  );

  /**
   * Simple wrapper that just stops propagation
   * Useful for preventing event bubbling
   */
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return {
    createClickHandler,
    stopPropagation,
    isNavigationLocked,
  };
}
