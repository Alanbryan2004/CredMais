import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  User, 
  HelpCircle, 
  LogOut, 
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) => {
  const { user, logout } = useApp();

  const menuItems = [
    { id: 'inicio', label: 'Início', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'vencimentos', label: 'Vencimentos', icon: Calendar },
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'suporte', label: 'Suporte', icon: HelpCircle },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile webview */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#066e38] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:w-64 md:shadow-none
      `}>
        {/* Header Branding */}
        <div>
          <div className="flex items-center justify-between p-4 border-b border-emerald-700/50">
            <div className="flex items-center">
              <img src="/Logo.png" alt="CredMais Logo" className="h-10 w-auto object-contain" />
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors md:hidden text-emerald-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-base transition-all
                    ${isActive 
                      ? 'bg-emerald-600/90 text-white font-semibold shadow-md shadow-emerald-900/30' 
                      : 'text-emerald-100 hover:bg-emerald-700/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-200'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile & Logout */}
        <div className="p-4 border-t border-emerald-700/50 bg-emerald-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center font-bold text-sm text-emerald-100 shrink-0">
                {user?.name?.charAt(0) || 'M'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Marcos Paulo'}</p>
                <p className="text-xs text-emerald-200 truncate">{user?.email || 'admin@credmais.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="p-2 rounded-lg text-emerald-200 hover:text-red-300 hover:bg-red-500/20 transition-colors shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
