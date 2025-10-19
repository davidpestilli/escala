import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ScheduleApp from './components/ScheduleApp';

// Componente principal do app
const AppContent = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Usuario logado - mostrar sistema completo de escalas
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com logout */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Sistema de Escalas</h1>
                <p className="text-xs text-gray-500">Logado como: {user.email}</p>
              </div>
            </div>
            
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Sistema completo de escalas */}
      <ScheduleApp />
    </div>
  );
};

// App wrapper com AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;