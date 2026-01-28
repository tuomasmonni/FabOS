import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider, useTheme, THEMES } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginModal, NicknameSetup, ProfilePage, RequireAuth } from './components/auth';
import VersionBadge from './components/VersionBadge';
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
const ProjectManagement = lazy(() => import('./ProjectManagement'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const MyVersionsPage = lazy(() => import('./components/auth/MyVersionsPage'));

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

// Login page for unauthenticated users
const LoginPage = () => {
  const { openLoginModal, openSignupModal } = useAuth();

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
              <span className="text-2xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg w-full text-center">
          {/* Logo/Icon */}
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl flex items-center justify-center bg-[#FF6B35]/10 border border-[#FF6B35]/30">
            <div className="text-center">
              <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
              <span className="text-4xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tervetuloa FabOS-alustalle!
          </h1>

          {/* Description */}
          <p className="text-lg mb-8 text-gray-400">
            Kirjaudu sisään tai luo uusi tili käyttääksesi sovellusta.
          </p>

          {/* Features box */}
          <div className="p-6 rounded-2xl mb-8 text-left bg-white/5 border border-gray-700">
            <h3 className="text-sm font-semibold mb-4 text-gray-300">
              Rekisteröityneille käyttäjille:
            </h3>
            <ul className="space-y-3">
              {[
                { icon: '🎨', text: 'Pääsy kaikkiin moduuleihin ja konfiguraattoreihin' },
                { icon: '🤖', text: 'AI-avusteinen kehitystila omien versioiden luomiseen' },
                { icon: '📊', text: 'Henkilökohtaiset tilastot ja saavutukset' },
                { icon: '⭐', text: 'Mahdollisuus äänestää ja arvostella versioita' },
                { icon: '📧', text: 'Sähköposti-ilmoitukset päivityksistä' }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="text-lg">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Login buttons */}
          <div className="space-y-3">
            <button
              onClick={() => openLoginModal('password')}
              className="w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-[#FF6B35] hover:bg-[#e5612f] text-white shadow-lg shadow-[#FF6B35]/25"
            >
              Kirjaudu sisään
            </button>

            <button
              onClick={openSignupModal}
              className="w-full py-4 px-8 rounded-xl font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-white/10 hover:bg-white/20 text-white border border-gray-600"
            >
              Luo uusi tili
            </button>
          </div>

          <p className="text-sm mt-4 text-gray-500">
            Rekisteröityminen on ilmaista ja vie vain hetken.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center border-t border-gray-700">
        <p className="text-sm text-gray-500">
          © 2025 FabOS - Valmistuksen tulevaisuus
        </p>
      </footer>
    </div>
  );
};

// Main app content that uses theme
function AppContent() {
  const { theme, isLoading, selectTheme } = useTheme();
  const { showProfilePage, closeProfilePage, showAdminDashboard, closeAdminDashboard, showMyVersionsPage, closeMyVersionsPage, isAuthenticated, loading: authLoading } = useAuth();
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
    if (urlVersion && ['v01', 'v02', 'v03', 'v035', 'v04', 'v06', 'v07', 'v08', 'vote-owner', 'vote-staff', 'vote-customer'].includes(urlVersion)) {
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

  // Debug logging
  console.log('[AppContent] Auth state:', { isAuthenticated, authLoading, isLoading, theme });

  // Show loading while checking theme OR auth
  if (isLoading || authLoading) {
    console.log('[AppContent] Showing loading screen');
    return <InitialLoadingScreen />;
  }

  // IMPORTANT: Check auth BEFORE theme selection
  // If not authenticated, show login page directly
  // This prevents unauthenticated users from accessing the theme selector
  if (!isAuthenticated) {
    console.log('[AppContent] User not authenticated - showing login page');
    return <LoginPage />;
  }

  console.log('[AppContent] User authenticated - proceeding to app');

  // If no theme selected, show theme selector (only for authenticated users)
  if (!theme) {
    return <ThemeSelectorPage />;
  }

  const isLegacy = theme === THEMES.LEGACY;
  const LoadingScreen = isLegacy ? LoadingScreenLegacy : LoadingScreenFabOS;

  // Wrap all content in RequireAuth - user must be logged in
  return (
    <RequireAuth>
      <AuthenticatedContent
        showAdminDashboard={showAdminDashboard}
        closeAdminDashboard={closeAdminDashboard}
        showProfilePage={showProfilePage}
        closeProfilePage={closeProfilePage}
        showMyVersionsPage={showMyVersionsPage}
        closeMyVersionsPage={closeMyVersionsPage}
        showSelector={showSelector}
        isLegacy={isLegacy}
        LoadingScreen={LoadingScreen}
        handleVersionSelect={handleVersionSelect}
        handleBackToSelector={handleBackToSelector}
        selectedVersion={selectedVersion}
      />
    </RequireAuth>
  );
}

// Separate component for authenticated content
function AuthenticatedContent({
  showAdminDashboard,
  closeAdminDashboard,
  showProfilePage,
  closeProfilePage,
  showMyVersionsPage,
  closeMyVersionsPage,
  showSelector,
  isLegacy,
  LoadingScreen,
  handleVersionSelect,
  handleBackToSelector,
  selectedVersion
}) {
  // Show admin dashboard if requested
  if (showAdminDashboard) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminDashboard onClose={closeAdminDashboard} />
      </Suspense>
    );
  }

  // Show My Versions page if requested
  if (showMyVersionsPage) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <MyVersionsPage onClose={closeMyVersionsPage} />
      </Suspense>
    );
  }

  // Show profile page if requested
  if (showProfilePage) {
    return <ProfilePage onClose={closeProfilePage} />;
  }

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
      {selectedVersion === 'v08' && <ProjectManagement onBack={handleBackToSelector} />}
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
        {/* Versionumero näkyy aina vasemmassa alakulmassa */}
        <VersionBadge position="bottom-left" />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
