import React from 'react';
import { Save, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Profile: React.FC = () => {
  const { user } = useApp();

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-16">
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.name || 'Marcos Paulo'}</h3>
            <p className="text-sm text-emerald-700 font-medium">Administrador CredMais</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert('Perfil atualizado com sucesso!'); }} className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Nome do Operador</label>
            <input 
              type="text" 
              defaultValue={user?.name || 'Marcos Paulo'} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">E-mail de Acesso</label>
            <input 
              type="email" 
              defaultValue={user?.email || 'admin@credmais.com'} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">Telefone WhatsApp Suporte</label>
            <input 
              type="text" 
              defaultValue="(11) 99999-8888" 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Support: React.FC = () => {
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-16">
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Suporte ao Cliente CredMais</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Dúvidas ou auxílio com as configurações do aplicativo CredMais? Entre em contato diretamente com o nosso suporte via WhatsApp.
        </p>
        <div className="pt-2">
          <a
            href="https://wa.me/5511999998888"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            <span>Falar no WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
