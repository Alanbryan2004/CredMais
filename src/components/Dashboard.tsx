import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { installments, contracts, formatCurrency } = useApp();

  const dueToday = installments.filter(i => i.status === 'Vencendo Hoje');
  const overdue = installments.filter(i => i.status === 'Atrasado');
  const received = installments.filter(i => i.status === 'Pago');

  const totalBorrowed = contracts.reduce((acc, c) => acc + c.amount, 0);
  const totalToReceive = contracts.reduce((acc, c) => acc + c.totalToReceive, 0);
  const totalReceived = received.reduce((acc, i) => acc + (i.paidAmount || i.originalAmount), 0);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto pb-16">
      
      {/* Cards de Status */}
      <div className="space-y-4">
        
        {/* Card Vencimento hoje */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-600 font-medium text-sm">Vencimento hoje</h3>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{dueToday.length}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => onNavigateTab('vencimentos')}
              className="text-amber-700 hover:text-amber-800 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver mais</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Parcelas atrasadas */}
        <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-600 font-medium text-sm">Parcelas atrasadas</h3>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{overdue.length}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => onNavigateTab('vencimentos')}
              className="text-red-600 hover:text-red-700 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver mais</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Parcelas recebidas */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-600 font-medium text-sm">Parcelas recebidas</h3>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{received.length}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => onNavigateTab('vencimentos')}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver mais</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Resumo Financeiro Geral */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>Resumo Geral da Carteira</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">Total Emprestado</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalBorrowed)}</p>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium">Total a Receber</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(totalToReceive)}</p>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">Total já Recebido</p>
            <p className="text-xl font-bold text-blue-800 mt-1">{formatCurrency(totalReceived)}</p>
          </div>
        </div>
      </div>

      {/* Gráfico Simulado do Print */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Evolução de Contratos</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">Mensal</span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 pt-6 px-4 pb-2 border-b border-gray-100">
          {[
            { month: 'Jul/24', value: 20 },
            { month: 'Ago/24', value: 25 },
            { month: 'Set/24', value: 35 },
            { month: 'Out/24', value: 90 },
          ].map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div 
                className="w-full max-w-[48px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 hover:brightness-110"
                style={{ height: `${bar.value}%` }}
              />
              <span className="text-xs text-gray-500 font-medium">{bar.month}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
