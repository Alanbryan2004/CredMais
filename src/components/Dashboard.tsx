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

  // Compute monthly data for the last 6 months (Real database values)
  const now = new Date();
  const monthsList: { key: string; label: string }[] = [];
  const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNamesShort[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
    monthsList.push({ key, label });
  }

  const monthlyData = monthsList.map(m => {
    // Total contract amounts created in this month
    const contractValue = contracts.reduce((acc, c) => {
      if (!c.createdAt) return acc;
      const cMonth = c.createdAt.slice(0, 7); // 'YYYY-MM'
      return cMonth === m.key ? acc + c.amount : acc;
    }, 0);

    // Total payments received in this month (from paid installments or payment history)
    const receivedValue = installments.reduce((acc, inst) => {
      if (inst.status !== 'Pago') return acc;
      const paidDate = inst.paidDate || inst.dueDate;
      if (!paidDate) return acc;
      const pMonth = paidDate.slice(0, 7);
      return pMonth === m.key ? acc + (inst.paidAmount || inst.originalAmount) : acc;
    }, 0);

    return {
      label: m.label,
      contractValue,
      receivedValue,
    };
  });

  const maxAmount = Math.max(
    ...monthlyData.flatMap(m => [m.contractValue, m.receivedValue]),
    1
  );

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

      {/* Gráfico de Evolução Real da Carteira (Contratos x Recebido) */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Evolução da Carteira (Mensal)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Comparativo do Valor dos Contratos Emprestados vs Valor Recebido</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
              <span className="text-gray-700">Contratos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
              <span className="text-gray-700">Recebido</span>
            </div>
          </div>
        </div>

        {/* Dynamic Dual-Bar Chart Container */}
        <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-8 px-2 pb-2">
          {monthlyData.map((m, idx) => {
            const contractPct = maxAmount > 0 ? (m.contractValue / maxAmount) * 100 : 0;
            const receivedPct = maxAmount > 0 ? (m.receivedValue / maxAmount) * 100 : 0;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                
                {/* Hover Tooltip Popup */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-lg pointer-events-none whitespace-nowrap space-y-0.5">
                  <p className="font-bold border-b border-slate-700 pb-0.5 text-slate-300">{m.label}</p>
                  <p className="text-emerald-400 font-semibold">Contratos: {formatCurrency(m.contractValue)}</p>
                  <p className="text-blue-400 font-semibold">Recebido: {formatCurrency(m.receivedValue)}</p>
                </div>

                {/* Bars Wrapper */}
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Contract Value Bar (Emerald) */}
                  <div 
                    className="flex-1 max-w-[24px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 group-hover:brightness-110 relative"
                    style={{ height: `${m.contractValue > 0 ? Math.max(contractPct, 8) : 3}%` }}
                    title={`Contratos: ${formatCurrency(m.contractValue)}`}
                  />

                  {/* Received Value Bar (Blue) */}
                  <div 
                    className="flex-1 max-w-[24px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 group-hover:brightness-110 relative"
                    style={{ height: `${m.receivedValue > 0 ? Math.max(receivedPct, 8) : 3}%` }}
                    title={`Recebido: ${formatCurrency(m.receivedValue)}`}
                  />
                </div>

                {/* Month Label */}
                <span className="text-[11px] text-gray-500 font-semibold mt-1">{m.label}</span>
              </div>
            );
          })}
        </div>

        {/* Legend Summary Footer */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/60 flex items-center justify-between">
            <span className="text-emerald-800 font-medium">Contratos no Período:</span>
            <span className="font-bold text-emerald-900">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.contractValue, 0))}
            </span>
          </div>
          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/60 flex items-center justify-between">
            <span className="text-blue-800 font-medium">Recebido no Período:</span>
            <span className="font-bold text-blue-900">
              {formatCurrency(monthlyData.reduce((sum, m) => sum + m.receivedValue, 0))}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
