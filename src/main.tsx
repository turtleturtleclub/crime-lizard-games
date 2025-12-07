import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './ErrorBoundary.tsx'
import { setupRpcProvider } from './config/rpcConfig'
import { NavigationProvider } from './contexts/NavigationContext'

// Initialize RPC provider with private RPC support
// This must happen before any blockchain reads
setupRpcProvider()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </ErrorBoundary>
  </StrictMode>,
)