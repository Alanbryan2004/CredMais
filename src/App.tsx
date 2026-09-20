import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Customers } from './components/Customers';
import { Contracts } from './components/Contracts';
import { InstallmentsView } from './components/InstallmentsView';
import { Profile, Support } from './components/ProfileSupport';
import { useAutoUpdate } from './hooks/useAutoUpdate';

const MainApp: React.FC = () => {
  const { isAuthenticated, user } = useApp();
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Auto-reload client whenever a new release build is published
  useAutoUpdate();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row antialiased select-none">
      
      {/* Sidebar Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <Header 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          activeTab={activeTab}
        />

        {/* Status Banner for Unapproved Users */}
        {user && !user.isAdmin && !user.isApproved && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600/30 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">⏳</span>
              <span><strong>Conta em Análise:</strong> Sua conta foi criada, mas aguarda liberação do Administrador (Alan ou Daniel) para salvar novos cadastros.</span>
            </div>
            <button 
              onClick={() => setActiveTab('perfil')}
              className="px-2.5 py-1 bg-amber-900 text-amber-100 hover:bg-amber-950 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
            >
              Ver Status
            </button>
          </div>
        )}

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'inicio' && <Dashboard onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'clientes' && <Customers />}
          {activeTab === 'contratos' && <Contracts />}
          {activeTab === 'vencimentos' && <InstallmentsView />}
          {activeTab === 'perfil' && <Profile />}
          {activeTab === 'suporte' && <Support />}
        </main>
      </div>

    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
