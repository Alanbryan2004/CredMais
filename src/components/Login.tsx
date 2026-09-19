import React, { useState } from 'react';
import { Lock, Mail, Phone, AlertCircle, ArrowRight, CheckCircle2, KeyRound, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useApp, translateAuthError } from '../context/AppContext';

type AuthMode = 'LOGIN' | 'REGISTER' | 'RECOVER';

export const Login: React.FC = () => {
  const { login, signUp, resetPassword } = useApp();
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login Form state
  const [email, setEmail] = useState('admin@credmais.com');
  const [password, setPassword] = useState('12345678');

  // Register Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Recover Password state
  const [recoverEmail, setRecoverEmail] = useState('');

  // Status messages
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFormState = () => {
    setError('');
    setSuccessMsg('');
    setLoading(false);
    setShowPassword(false);
    setShowRegPassword(false);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    if (!email || !password) {
      setError('Por favor preencha todos os campos.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(translateAuthError(res.error || 'Falha na autenticação. Verifique seu e-mail e senha.'));
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!firstName || !lastName || !regEmail || !phone || !regPassword || !confirmPassword) {
      setError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    if (regPassword !== confirmPassword) {
      setError('As senhas não coincidem. Por favor confirme a mesma senha.');
      return;
    }

    setLoading(true);
    const res = await signUp({
      firstName,
      lastName,
      email: regEmail,
      phone,
      password: regPassword
    });
    setLoading(false);

    if (!res.success) {
      setError(translateAuthError(res.error || 'Ocorreu um erro ao criar a conta.'));
    } else {
      setSuccessMsg(res.message || 'Cadastro realizado com sucesso! Insira suas credenciais para acessar.');
      setEmail(regEmail);
      setPassword(regPassword);
      setMode('LOGIN');
    }
  };

  // Submit Recovery
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!recoverEmail) {
      setError('Por favor informe o seu e-mail de cadastro.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(recoverEmail);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Instruções enviadas para o seu e-mail!');
    } else {
      setError(translateAuthError(res.error || 'Ocorreu um erro ao solicitar a recuperação de senha.'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 transition-all">
        
        {/* Top Header Logo */}
        <div className="bg-emerald-700 p-8 text-center text-white relative flex justify-center items-center">
          <img src="/Logo.png" alt="CredMais Logo" className="max-w-[210px] h-auto object-contain drop-shadow-md" />
        </div>

        {/* Dynamic Form Area */}
        <div className="p-8">

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Senha</label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('RECOVER')}
                    className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Acessando...' : 'Acessar Aplicativo'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Ainda não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('REGISTER')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Cadastre-se
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Nome *</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Sobrenome *</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sobrenome"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">E-mail *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Telefone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 90000-0000"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Senha *</label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? 'text' : 'password'} 
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      title={showRegPassword ? 'Ocultar' : 'Exibir'}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Repetir Senha *</label>
                  <input 
                    type={showRegPassword ? 'text' : 'password'} 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>{loading ? 'Cadastrando...' : 'Criar Minha Conta'}</span>
              </button>

              <div className="pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-500">
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('LOGIN')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. RECOVER PASSWORD FORM */}
          {mode === 'RECOVER' && (
            <form onSubmit={handleRecoverSubmit} className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Recuperar Senha</h3>
                <p className="text-xs text-gray-500">
                  Digite o e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email" 
                    required
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Enviando...' : 'Enviar Link de Recuperação'}</span>
              </button>

              <div className="pt-3 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('LOGIN')}
                  className="text-xs text-gray-600 hover:text-emerald-700 font-semibold cursor-pointer"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
