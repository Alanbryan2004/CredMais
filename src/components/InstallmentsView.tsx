import React, { useState } from 'react';
import { ThumbsUp, DollarSign, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Installment } from '../types';

export const InstallmentsView: React.FC = () => {
  const { installments, contracts, payInstallment, calculateLateFee, formatCurrency } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

  const [paymentType, setPaymentType] = useState<'TOTAL' | 'JUROS' | 'PARCIAL'>('TOTAL');
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [includeLateFee, setIncludeLateFee] = useState<boolean>(true);
  const [paymentNote, setPaymentNote] = useState<string>('');

  const handleOpenPaymentModal = (inst: Installment) => {
    setSelectedInstallment(inst);
    setPaymentType('TOTAL');
    setCustomAmount(inst.originalAmount);
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 15);
    setNewDueDate(nextDate.toISOString().split('T')[0]);
    setIncludeLateFee(true);
    setPaymentNote('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    payInstallment({
      installmentId: selectedInstallment.id,
      type: paymentType,
      amountPaid: Number(customAmount),
      newDueDate: paymentType !== 'TOTAL' ? newDueDate : undefined,
      applyDailyFee: includeLateFee,
      note: paymentNote
    });

    setSelectedInstallment(null);
  };

  const filteredInstallments = installments.filter(inst => {
    if (filterStatus === 'todos') return true;
    if (filterStatus === 'atrasados') return inst.status === 'Atrasado';
    if (filterStatus === 'hoje') return inst.status === 'Vencendo Hoje';
    if (filterStatus === 'vencer') return inst.status === 'A vencer';
    if (filterStatus === 'pago') return inst.status === 'Pago';
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-16">
      
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'todos', label: 'Todas' },
          { id: 'atrasados', label: 'Atrasados' },
          { id: 'hoje', label: 'Vencendo Hoje' },
          { id: 'vencer', label: 'A vencer' },
          { id: 'pago', label: 'Pagas' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`
              px-3.5 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer
              ${filterStatus === tab.id 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header Bar */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-xs flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
        <span>Dados da Parcela</span>
        <span>Ações</span>
      </div>

      {/* Installments Cards matching EXACTLY Screenshot 1 */}
      <div className="space-y-3">
        {filteredInstallments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 text-sm">
            Nenhuma parcela encontrada para esta filtragem.
          </div>
        ) : (
          filteredInstallments.map(inst => {
            const contract = contracts.find(c => c.id === inst.contractId);
            const lateFee = calculateLateFee(inst);
            const formattedDate = inst.dueDate ? inst.dueDate.split('-').reverse().join('/') : '';

            return (
              <div 
                key={inst.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1.5 text-xs">
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      inst.status === 'Atrasado' ? 'bg-red-100 text-red-600' :
                      inst.status === 'Vencendo Hoje' ? 'bg-amber-100 text-amber-700' :
                      inst.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {inst.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-700">
                    <span className="font-bold">Vencimento:</span>
                    <span className="font-semibold text-gray-900">{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-700">
                    <span className="font-bold">Cliente:</span>
                    <span className="font-semibold text-gray-900">{contract?.customerName || 'Neymar Junior'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-700">
                    <span className="font-bold">Nº Parcela:</span>
                    <span className="font-semibold text-gray-900">{inst.installmentNumber}/{inst.totalInstallments}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-700">
                    <span className="font-bold">Valor:</span>
                    <span className="font-extrabold text-gray-900 text-sm">{formatCurrency(inst.originalAmount)}</span>
                    {lateFee > 0 && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md font-bold border border-red-200">
                        +{formatCurrency(lateFee)} Juros Atraso
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {inst.status === 'Pago' ? (
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100" title="Parcela Quitada">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenPaymentModal(inst)}
                      className="p-3 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-2xl border border-gray-200 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                      title="Registrar Pagamento"
                    >
                      <ThumbsUp className="w-6 h-6" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Flexible Payment Modal */}
      {selectedInstallment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-base text-emerald-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Receber Parcela #{selectedInstallment.installmentNumber}</span>
              </h3>
              <button 
                onClick={() => setSelectedInstallment(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4 text-sm">
              
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1 text-xs">
                <p><strong>Valor da Parcela:</strong> {formatCurrency(selectedInstallment.originalAmount)}</p>
                {calculateLateFee(selectedInstallment) > 0 && (
                  <p className="text-red-600 font-bold">
                    <strong>Juros de Atraso Acumulados:</strong> {formatCurrency(calculateLateFee(selectedInstallment))}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('TOTAL');
                      setCustomAmount(selectedInstallment.originalAmount + calculateLateFee(selectedInstallment));
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                      paymentType === 'TOTAL'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Quitação Total
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('JUROS');
                      const interestOnlyVal = selectedInstallment.originalAmount * 0.3;
                      setCustomAmount(interestOnlyVal);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all ${
                      paymentType === 'JUROS'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Pagar Apenas Juros
                  </button>
                </div>
              </div>

              {paymentType === 'JUROS' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-2">
                  <p className="font-semibold">
                    * Ao pagar apenas o Juros, o valor principal continua em aberto e uma nova data de vencimento deve ser definida abaixo.
                  </p>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nova Data de Vencimento</label>
                    <input 
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-600 font-medium mb-1">Valor a Receber (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-800 text-base"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Observação do Recebimento</label>
                <input 
                  type="text"
                  placeholder="Ex: Recebido em PIX / Dinheiro"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedInstallment(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Confirmar Recebimento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
