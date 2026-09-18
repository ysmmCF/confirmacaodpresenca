import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { GroupsManagement } from './pages/GroupsManagement';
import { GroupDetail } from './pages/GroupDetail';
import { AdminManagement } from './pages/AdminManagement';
import { PublicRSVP } from './pages/PublicRSVP';

export const App: React.FC = () => {
  // Basename limpo e dinâmico para GitHub Pages ou Localhost
  const getBasename = () => {
    return window.location.pathname.startsWith('/confirmacaodpresenca')
      ? '/confirmacaodpresenca'
      : '';
  };

  return (
    <AuthProvider>
      <BrowserRouter basename={getBasename()}>
        <Routes>
          {/* Rota Pública de Confirmação por Grupo */}
          <Route path="/confirmacao/:token" element={<PublicRSVP />} />

          {/* Rota de Login Administrativo */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Administrativas Protegidas */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/grupos"
            element={
              <ProtectedRoute>
                <GroupsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/grupos/:id"
            element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/administradores"
            element={
              <ProtectedRoute>
                <AdminManagement />
              </ProtectedRoute>
            }
          />

          {/* Redirecionamento Padrão */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
