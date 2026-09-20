import React from 'react';
import { Menu, Bell, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSidebar: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, activeTab }) => {
  const { installments, isSyncing, refreshData } = useApp();

  const overdueCount = installments.filter(i => i.status === 'Atrasado').length;
  const todayCount = installments.filter(i => i.status === 'Vencendo Hoje').length;

  const tabTitles: Record<string, string> = {
    inicio: 'Visão Geral',
    clientes: 'Cadastro de Clientes',
    contratos: 'Contratos de Empréstimo',
    vencimentos: 'Vencimentos e Parcela',
    perfil: 'Configurações de Perfil',
    suporte: 'Suporte & Ajuda'
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors focus:outline-hidden cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <img src="/Logo.png" alt="CredMais Logo" className="h-8 w-auto object-contain" />
        </div>
      </div>

      <div className="flex items-center gap-2">

        {(overdueCount > 0 || todayCount > 0) && (
          <div className="relative">
            <span className="flex h-3 w-3 absolute -top-0.5 -right-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        )}
        <div className="hidden sm:block text-right border-l pl-3 border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{tabTitles[activeTab] || 'CredMais'}</p>
        </div>
      </div>
    </header>
  );
};
