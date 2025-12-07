import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

/**
 * Portal Component
 *
 * Renders children into a DOM node outside of the parent component's hierarchy.
 * This ensures proper z-index stacking for modals, tooltips, and overlays.
 *
 * @param children - The content to render in the portal
 * @param containerId - Optional ID for a specific container (defaults to document.body)
 */
export function Portal({ children, containerId }: PortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let element: HTMLElement;

    if (containerId) {
      element = document.getElementById(containerId) || document.body;
    } else {
      // Create or get the default portal container
      const portalRoot = document.getElementById('portal-root');
      if (portalRoot) {
        element = portalRoot;
      } else {
        // Create portal root if it doesn't exist
        const newRoot = document.createElement('div');
        newRoot.id = 'portal-root';
        document.body.appendChild(newRoot);
        element = newRoot;
      }
    }

    setContainer(element);

    return () => {
      // Cleanup: Remove portal root if it's empty
      if (
        !containerId &&
        element.id === 'portal-root' &&
        element.childNodes.length === 0
      ) {
        element.remove();
      }
    };
  }, [containerId]);

  if (!container) {
    return null;
  }

  return createPortal(children, container);
}
