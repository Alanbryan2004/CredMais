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
  const { isAuthenticated } = useApp();
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
