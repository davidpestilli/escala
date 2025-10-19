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