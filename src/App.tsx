/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { LoginView } from './views/LoginView';
import { 
  AdminDashboard, 
  DirectorDashboard, 
  PedagogicalDashboard, 
  TeacherDashboard, 
  SecretariatDashboard, 
  FinancialDashboard, 
  GovernanceDashboard, 
  StudentDashboard 
} from './profiles';
import { Layout } from './components/Layout';
import { DashboardNoticeBanner } from './components/DashboardNoticeBanner';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';
import { InitialLandingScreen } from './components/InitialLandingScreen';

import { ErrorBoundary } from './components/ErrorBoundary';
import { PasswordChangeModal } from './components/PasswordChangeModal';

export function getAssignedRouteForRole(role?: string): string {
  if (!role) return '/';
  switch (role) {
    case 'admin':
      return '/admin/systemHealth';
    case 'director':
      return '/director';
    case 'pedagogical':
    case 'pedagogical_c1':
    case 'pedagogical_c2':
    case 'pedagogical_c3':
      return '/pedagogical';
    case 'teacher':
      return '/teacher';
    case 'secretariat':
    case 'secretariat_rh':
    case 'secretariat_patrimonio':
    case 'secretariat_recepcao':
    case 'secretariat_arquivo':
    case 'librarian':
      return '/secretariat';
    case 'financial':
    case 'secretariat_financas':
      return '/financial';
    case 'national':
    case 'provincial':
    case 'district':
      return '/governance';
    case 'student':
    case 'guardian':
      return '/student';
    default:
      return '/';
  }
}

export function isRouteAllowedForRole(pathname: string, role?: string): boolean {
  if (!role) return false;
  if (pathname === '/') return true;
  if (role === 'admin') {
    return pathname.startsWith('/admin');
  }
  if (role === 'director') {
    return pathname.startsWith('/director');
  }
  if (['pedagogical', 'pedagogical_c1', 'pedagogical_c2', 'pedagogical_c3'].includes(role)) {
    return pathname.startsWith('/pedagogical');
  }
  if (role === 'teacher') {
    return pathname.startsWith('/teacher');
  }
  if (['secretariat', 'secretariat_rh', 'secretariat_patrimonio', 'secretariat_recepcao', 'secretariat_arquivo', 'librarian'].includes(role)) {
    return pathname.startsWith('/secretariat');
  }
  if (role === 'financial' || role === 'secretariat_financas') {
    return pathname.startsWith('/financial');
  }
  if (['national', 'provincial', 'district'].includes(role)) {
    return pathname.startsWith('/governance');
  }
  if (role === 'student' || role === 'guardian') {
    return pathname.startsWith('/student');
  }
  return false;
}

function RoleNavigationSync() {
  const { currentUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      const assigned = getAssignedRouteForRole(currentUser.role);
      if (location.pathname === '/' || !isRouteAllowedForRole(location.pathname, currentUser.role)) {
        if (location.pathname !== assigned) {
          navigate(assigned, { replace: true });
        }
      }
    }
  }, [currentUser?.id, currentUser?.role, location.pathname, navigate]);

  return null;
}

function ProtectedRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getAssignedRouteForRole(currentUser.role)} replace />;
  }
  return <>{children}</>;
}

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

  return (
    <>
      {currentUser.mustChangePassword && <PasswordChangeModal onClose={() => {}} />}
      <BrowserRouter>
        <RoleNavigationSync />
        <Layout>
          <DashboardNoticeBanner />
          <ErrorBoundary fallbackTitle="Erro ao Carregar Painel">
            <Routes>
              {/* Root redirect: directly to assigned area */}
              <Route path="/" element={<Navigate to={getAssignedRouteForRole(currentUser.role)} replace />} />

              {/* Protected Routes for each assigned area */}
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/director/*" element={
                <ProtectedRoute allowedRoles={['director']}>
                  <DirectorDashboard />
                </ProtectedRoute>
              } />

              <Route path="/pedagogical/*" element={
                <ProtectedRoute allowedRoles={['pedagogical', 'pedagogical_c1', 'pedagogical_c2', 'pedagogical_c3']}>
                  <PedagogicalDashboard />
                </ProtectedRoute>
              } />

              <Route path="/teacher/*" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } />

              <Route path="/secretariat/*" element={
                <ProtectedRoute allowedRoles={['secretariat', 'secretariat_rh', 'secretariat_patrimonio', 'secretariat_recepcao', 'secretariat_arquivo', 'librarian']}>
                  <SecretariatDashboard />
                </ProtectedRoute>
              } />

              <Route path="/financial/*" element={
                <ProtectedRoute allowedRoles={['financial', 'secretariat_financas', 'admin']}>
                  <FinancialDashboard />
                </ProtectedRoute>
              } />

              <Route path="/governance/*" element={
                <ProtectedRoute allowedRoles={['national', 'provincial', 'district']}>
                  <GovernanceDashboard />
                </ProtectedRoute>
              } />

              <Route path="/student/*" element={
                <ProtectedRoute allowedRoles={['student', 'guardian']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />

              {/* Catch-all unknown routes: redirect to assigned area */}
              <Route path="*" element={<Navigate to={getAssignedRouteForRole(currentUser.role)} replace />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
      </BrowserRouter>
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
