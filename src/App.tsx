/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import { LoginView } from './views/LoginView';
import { AdminDashboard } from './views/AdminDashboard';
import { DirectorDashboard } from './views/DirectorDashboard';
import { PedagogicalDashboard } from './views/PedagogicalDashboard';
import { TeacherDashboard } from './views/TeacherDashboard';
import { SecretariatDashboard } from './views/SecretariatDashboard';
import { GovernanceDashboard } from './components/GovernanceDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Layout } from './components/Layout';
import { DashboardNoticeBanner } from './components/DashboardNoticeBanner';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { InitialLandingScreen } from './components/InitialLandingScreen';

import { ErrorBoundary } from './components/ErrorBoundary';
import { PasswordChangeModal } from './components/PasswordChangeModal';

function AppContent() {
  const { currentUser } = useStore();
  const [showSplash, setShowSplash] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const [isLanding, setIsLanding] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const isFresh = sessionStorage.getItem('isFreshLogin') === 'true';
      if (isFresh && currentUser.id !== lastUserId) {
        setShowSplash(true);
        setLastUserId(currentUser.id);
        sessionStorage.removeItem('isFreshLogin');
      }
    } else {
      setShowSplash(false);
      setLastUserId(null);
      setIsLanding(true);
    }
  }, [currentUser, lastUserId]);

  if (!currentUser) {
    if (isLanding) {
      return <InitialLandingScreen onContinue={() => setIsLanding(false)} />;
    }
    return <LoginView />;
  }

  if (showSplash) {
    return <WelcomeSplashScreen onClose={() => setShowSplash(false)} />;
  }

  const isGovernance = ['national', 'provincial', 'district'].includes(currentUser.role);

  return (
    <>
      {currentUser.mustChangePassword && <PasswordChangeModal onClose={() => {}} />}
      <Layout>
        <DashboardNoticeBanner />
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel Administrativo">
          {currentUser.role === 'admin' && <AdminDashboard />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel da Direcção">
          {currentUser.role === 'director' && <DirectorDashboard />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel Pedagógico">
          {currentUser.role === 'pedagogical' && <PedagogicalDashboard />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel do Professor">
          {currentUser.role === 'teacher' && <TeacherDashboard />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel da Secretaria">
          {currentUser.role === 'secretariat' && <SecretariatDashboard />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel de Governação">
          {isGovernance && <GovernanceDashboard />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Erro ao Carregar Painel do Aluno">
          {currentUser.role === 'student' && <StudentDashboard />}
        </ErrorBoundary>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

