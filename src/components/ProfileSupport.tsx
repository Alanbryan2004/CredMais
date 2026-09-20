import React, { useState } from 'react';
import { Save, MessageSquare, ShieldCheck, UserCheck, UserX, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Profile: React.FC = () => {
  const { user, approvedUsers, approveUser, revokeUser } = useApp();
  const [newEmailToApprove, setNewEmailToApprove] = useState('');

  const handleApproveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailToApprove || !newEmailToApprove.includes('@')) {
      alert('Por favor informe um e-mail válido para liberar.');
      return;
    }
    approveUser(newEmailToApprove.trim());
    alert(`Acesso liberado com sucesso para ${newEmailToApprove}!`);
    setNewEmailToApprove('');
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-16">
      
      {/* Account Approval Status Banner if NOT approved */}
      {user && !user.isAdmin && !user.isApproved && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-900 flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">Aguardando Liberação de Administrador</h4>
            <p className="text-amber-800 leading-relaxed">
              Sua conta foi criada com sucesso! Para utilizar e salvar dados no sistema, um Administrador (Alan ou Daniel) precisa liberar seu acesso.
            </p>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{user?.name || 'Usuário CredMais'}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${user?.isAdmin ? 'bg-emerald-100 text-emerald-800' : user?.isApproved ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                {user?.isAdmin ? '👑 Administrador (Alan/Daniel)' : user?.isApproved ? '✅ Acesso Liberado' : '⏳ Aguardando Liberação'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); alert('Perfil atualizado com sucesso!'); }} className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-600 font-medium mb-1">Nome do Operador</label>
            <input 
              type="text" 
              defaultValue={user?.name || ''} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">E-mail de Acesso</label>
            <input 
              type="email" 
              disabled
              value={user?.email || ''} 
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-xl font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Perfil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin User Approval Management Panel (Only for Admins: Alan or Daniel) */}
      {user?.isAdmin && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-base text-white">Painel de Liberação de Usuários</h3>
              <p className="text-xs text-slate-400">Exclusivo para Administradores (Alan & Daniel)</p>
            </div>
          </div>

          <form onSubmit={handleApproveForm} className="flex gap-2">
            <input 
              type="email"
              value={newEmailToApprove}
              onChange={(e) => setNewEmailToApprove(e.target.value)}
              placeholder="Digite o e-mail do usuário a liberar..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Liberar Acesso</span>
            </button>
          </form>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">E-mails Liberados no Sistema ({approvedUsers.length}):</h4>
            {approvedUsers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum e-mail adicional liberado no momento (Alan e Daniel possuem acesso automático).</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {approvedUsers.map((approvedEmail) => (
                  <div key={approvedEmail} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span className="font-mono text-emerald-300">{approvedEmail}</span>
                    <button
                      onClick={() => revokeUser(approvedEmail)}
                      className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-900 text-rose-300 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Revogar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
          Dúvidas ou solicitações de liberação de acesso com os Administradores (Alan & Daniel)? Entre em contato diretamente pelo WhatsApp.
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

