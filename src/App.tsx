import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Howl } from 'howler';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminPanel from './components/AdminPanel';
import CharacterEntry from './components/CharacterEntry';
import DiceGame from './components/DiceGame_V3';
import RewardsPage from './components/RewardsPage';
import { WalletProvider } from './providers/WalletProvider';
import { LanguageProvider } from './contexts/LanguageContext';
import { CharacterProvider } from './contexts/CharacterContext';
import { LegendGameProvider } from './contexts/LegendGameContext';
import { QuestProvider } from './contexts/QuestContext';
import EnhancedHeader from './components/EnhancedHeader';
import Footer from './components/Footer';
import ModernChat from './components/ModernChat';
import NetworkStatus from './components/NetworkStatus';
import { testRoutes, isTestRoutePath } from './routes/testRoutes';
import './App.css';

// Maintenance Mode Flag
const MAINTENANCE_MODE = false;

// App Content Component (needs to be inside Router context)
function AppContent() {
  const location = useLocation();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('crimeLizardSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [soundSystemReady, setSoundSystemReady] = useState(false);

  // Check if on the test route to bypass maintenance
  const isTestRoute = isTestRoutePath(location.pathname);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  // Ensure page loads at top on initial mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // Disable browser scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Initialize sound system
  useEffect(() => {
    const initializeSound = async () => {
      try {
        // Test sound playback
        const testSound = new Howl({
          src: ['/assets/spin.mp3'],
          volume: 0.1,
          onload: () => {
            setSoundSystemReady(true);
},
          onloaderror: (_, error) => {
            console.warn('⚠️ Sound system initialization failed:', error);
            setSoundSystemReady(false);
          }
        });

        // Clean up test sound
        setTimeout(() => {
          if (testSound) {
            testSound.unload();
          }
        }, 1000);

      } catch (error) {
        console.warn('⚠️ Sound system initialization error:', error);
        setSoundSystemReady(false);
      }
    };

    initializeSound();

    // Add global click handler for audio context initialization
    const handleGlobalClick = async () => {
      if (!soundSystemReady) {
        try {
          if (typeof window !== 'undefined' && 'AudioContext' in window) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
              setSoundSystemReady(true);
}
          }
        } catch (error) {
          console.warn('⚠️ Failed to resume audio context:', error);
        }
      }
    };

    // Add event listener for first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleGlobalClick, { once: true });
      document.addEventListener('touchstart', handleGlobalClick, { once: true });
      document.addEventListener('keydown', handleGlobalClick, { once: true });
    }

    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('touchstart', handleGlobalClick);
        document.removeEventListener('keydown', handleGlobalClick);
      }
    };
  }, []); // ✅ FIXED: Removed soundSystemReady to prevent infinite re-render loop

  // Maintenance Mode Screen (bypass for test route)
  if (MAINTENANCE_MODE && !isTestRoute) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: '#00FF88',
        fontFamily: "'Press Start 2P', monospace",
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{
          border: '4px solid #00FF88',
          borderRadius: '12px',
          padding: '40px',
          background: 'rgba(0, 0, 0, 0.7)',
          boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)',
          maxWidth: '600px',
          position: 'relative',
        }}>
          {/* Lizards around the box */}
          <div style={{ position: 'absolute', top: '-30px', left: '20px', fontSize: '40px', transform: 'rotate(-20deg)' }}>🦎</div>
          <div style={{ position: 'absolute', top: '-30px', right: '20px', fontSize: '40px', transform: 'rotate(20deg) scaleX(-1)' }}>🦎</div>
          <div style={{ position: 'absolute', bottom: '-30px', left: '30px', fontSize: '40px', transform: 'rotate(15deg)' }}>🦎</div>
          <div style={{ position: 'absolute', bottom: '-30px', right: '30px', fontSize: '40px', transform: 'rotate(-15deg) scaleX(-1)' }}>🦎</div>

          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔧</div>
          <h1 style={{ fontSize: '20px', marginBottom: '30px', color: '#00FF88' }}>
            CLOSED FOR MAINTENANCE
          </h1>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://app.openocean.finance/swap/bsc/BNB/CLZD"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '10px',
                color: '#00FF88',
                textDecoration: 'none',
                padding: '10px 20px',
                border: '2px solid #00FF88',
                borderRadius: '6px',
                transition: 'all 0.3s',
              }}
            >
              BUY
            </a>
            <a
              href="https://x.com/CrimeLizardBNB"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '10px',
                color: '#00FF88',
                textDecoration: 'none',
                padding: '10px 20px',
                border: '2px solid #00FF88',
                borderRadius: '6px',
                transition: 'all 0.3s',
              }}
            >
              X
            </a>
            <a
              href="https://t.me/CrimeLizard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '10px',
                color: '#00FF88',
                textDecoration: 'none',
                padding: '10px 20px',
                border: '2px solid #00FF88',
                borderRadius: '6px',
                transition: 'all 0.3s',
              }}
            >
              TELEGRAM
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer
        theme="dark"
        toastClassName="!bg-black !border-2 !border-[#00FF88] font-bbs !text-[#00FF88]"
        progressClassName="!bg-[#00FF88]"
        closeButton={false}
        autoClose={2500}
        position="top-right"
        hideProgressBar={false}
        closeOnClick={true}
        draggable={true}
        pauseOnHover={true}
        limit={5}
      />
      <EnhancedHeader
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        soundSystemReady={soundSystemReady}
      />
      <main>
        <Routes>
          {/* Main Game World - Character-First Entry (text-based terminal UI) */}
          <Route path="/" element={<CharacterEntry use2DMap={false} />} />

          {/* Test Routes - imported from separate file (gitignored) */}
          {testRoutes}

          {/* Standalone Games & Pages */}
          <Route path="/dice" element={<DiceGame />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>

      {/* Global Network Status Indicator */}
      <NetworkStatus />
      <Footer />
      <ModernChat soundEnabled={soundEnabled} soundSystemReady={soundSystemReady} />
    </>
  );
}

// Main App Component
// IMPORTANT: Router must be at the top level, outside all context providers,
// to ensure proper navigation and location updates throughout the app
function App() {
  return (
    <Router>
      <LanguageProvider>
        <WalletProvider>
          <CharacterProvider>
            <QuestProvider>
              <LegendGameProvider>
                <AppContent />
              </LegendGameProvider>
            </QuestProvider>
          </CharacterProvider>
        </WalletProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
