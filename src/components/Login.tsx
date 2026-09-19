import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor preencha todos os campos');
      return;
    }
    const success = login(username, password);
    if (!success) {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100">
        
        <div className="bg-emerald-700 p-8 text-center text-white relative flex justify-center items-center">
          <img src="/Logo.png" alt="CredMais Logo" className="max-w-[220px] h-auto object-contain drop-shadow-md" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Usuário / E-mail</label>
            <div className="relative">
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Informe seu usuário"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Acessar Aplicativo</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="pt-2 text-center text-xs text-gray-400">
            Acesso demonstrativo liberado com usuário padrão.
          </div>
        </form>
      </div>
    </div>
  );
};
