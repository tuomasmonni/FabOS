import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider, useTheme, THEMES } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LoginModal, NicknameSetup } from './components/auth';
import ThemeSelectorPage from './ThemeSelector';
import VersionSelector from './VersionSelector';
import './index.css';

// Lazy load version components
const AppV01 = lazy(() => import('./AppV01'));
const AppV02 = lazy(() => import('./AppV02'));
const PipeBendingApp = lazy(() => import('./PipeBendingApp'));
const OwnerVotingPage = lazy(() => import('./OwnerVotingPage'));
const StaffVotingPage = lazy(() => import('./StaffVotingPage'));
const CustomerVotingPage = lazy(() => import('./CustomerVotingPage'));
const FeatureSuggestionPage = lazy(() => import('./FeatureSuggestionPage'));
const StairConfigurator = lazy(() => import('./StairConfigurator'));
const GratingConfigurator = lazy(() => import('./GratingConfigurator'));

// Lazy load FabOS version selector
const FabOSVersionSelector = lazy(() => import('./FabOSVersionSelector'));

// Loading component for Legacy theme
const LoadingScreenLegacy = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400">Ladataan...</p>
    </div>
  </div>
);

// Loading component for FabOS theme
const LoadingScreenFabOS = () => (
  <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500">Ladataan...</p>
    </div>
  </div>
);

// Initial loading screen (theme-neutral)
const InitialLoadingScreen = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
  </div>
);

// Main app content that uses theme
function AppContent() {
  const { theme, isLoading, selectTheme } = useTheme();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showSelector, setShowSelector] = useState(true);

  useEffect(() => {
    // Check URL for theme parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get('theme');

    if (urlTheme === 'fabos' || urlTheme === 'legacy') {
      selectTheme(urlTheme);
    }

    // Check URL for direct version access
    const urlVersion = urlParams.get('version');
    if (urlVersion && ['v01', 'v02', 'v03', 'v035', 'v04', 'v06', 'v07', 'vote-owner', 'vote-staff', 'vote-customer'].includes(urlVersion)) {
      setSelectedVersion(urlVersion);
      setShowSelector(false);
    }
  }, []);

  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setShowSelector(false);
  };

  const handleBackToSelector = () => {
    setShowSelector(true);
    setSelectedVersion(null);
    // Remove version from URL but keep theme
    const url = new URL(window.location);
    url.searchParams.delete('version');
    window.history.pushState({}, '', url);
  };

  // Show loading while checking theme
  if (isLoading) {
    return <InitialLoadingScreen />;
  }

  // If no theme selected, show theme selector
  if (!theme) {
    return <ThemeSelectorPage />;
  }

  const isLegacy = theme === THEMES.LEGACY;
  const LoadingScreen = isLegacy ? LoadingScreenLegacy : LoadingScreenFabOS;

  // Show version selector
  if (showSelector) {
    if (isLegacy) {
      return <VersionSelector onSelect={handleVersionSelect} />;
    } else {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <FabOSVersionSelector onSelect={handleVersionSelect} />
        </Suspense>
      );
    }
  }

  // Render selected version
  return (
    <Suspense fallback={<LoadingScreen />}>
      {selectedVersion === 'v01' && <AppV01 onBack={handleBackToSelector} />}
      {selectedVersion === 'v02' && <AppV02 onBack={handleBackToSelector} />}
      {selectedVersion === 'v03' && <PipeBendingApp onBack={handleBackToSelector} />}
      {selectedVersion === 'vote-owner' && <OwnerVotingPage onBack={handleBackToSelector} />}
      {selectedVersion === 'vote-staff' && <StaffVotingPage onBack={handleBackToSelector} />}
      {selectedVersion === 'vote-customer' && <CustomerVotingPage onBack={handleBackToSelector} />}
      {selectedVersion === 'v04' && <GratingConfigurator onBack={handleBackToSelector} />}
      {selectedVersion === 'v06' && <StairConfigurator onBack={handleBackToSelector} />}
      {selectedVersion === 'v07' && <FeatureSuggestionPage onBack={handleBackToSelector} />}
    </Suspense>
  );
}

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        {/* Auth modaalit - aina renderöitynä */}
        <LoginModal />
        <NicknameSetup />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
