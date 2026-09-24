import React, { useState } from 'react';
import { Plus, Search, FileText, Calendar, X, Trash2, Edit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Contract } from '../types';

export const Contracts: React.FC = () => {
  const { customers, contracts, installments, addContract, updateContract, deleteContract, formatCurrency } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    contractNumber: (contracts.length + 1).toString(),
    startDate: new Date().toISOString().split('T')[0],
    amount: 6000,
    interestRate: 30,
    totalInstallments: 120,
    periodDays: 15,
    dailyLateFee: 5.00,
    notes: 'Informações adicionais'
  });

  const calculatedTotalWithInterest = formData.amount + (formData.amount * (formData.interestRate / 100));
  const calculatedInstallmentAmount = formData.totalInstallments > 0 ? (calculatedTotalWithInterest / formData.totalInstallments) : 0;

  const handleOpenModal = () => {
    setEditingContract(null);
    setFormData({
      customerId: customers[0]?.id || '',
      contractNumber: (contracts.length + 1).toString(),
      startDate: new Date().toISOString().split('T')[0],
      amount: 6000,
      interestRate: 30,
      totalInstallments: 120,
      periodDays: 15,
      dailyLateFee: 5.00,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEditContract = (cnt: Contract) => {
    setEditingContract(cnt);
    setFormData({
      customerId: cnt.customerId,
      contractNumber: cnt.contractNumber,
      startDate: cnt.startDate,
      amount: cnt.amount,
      interestRate: cnt.interestRate,
      totalInstallments: cnt.totalInstallments,
      periodDays: cnt.periodDays,
      dailyLateFee: cnt.dailyLateFee,
      notes: cnt.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Por favor selecione um cliente.');
      return;
    }
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    if (editingContract) {
      updateContract({
        ...editingContract,
        contractNumber: formData.contractNumber,
        customerId: formData.customerId,
        customerName: customer.name,
        startDate: formData.startDate,
        amount: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        periodDays: Number(formData.periodDays),
        totalInstallments: Number(formData.totalInstallments),
        installmentAmount: Number(calculatedInstallmentAmount.toFixed(2)),
        totalToReceive: Number(calculatedTotalWithInterest.toFixed(2)),
        dailyLateFee: Number(formData.dailyLateFee),
        notes: formData.notes
      });
    } else {
      addContract({
        contractNumber: formData.contractNumber,
        customerId: formData.customerId,
        customerName: customer.name,
        startDate: formData.startDate,
        amount: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        periodDays: Number(formData.periodDays),
        totalInstallments: Number(formData.totalInstallments),
        installmentAmount: Number(calculatedInstallmentAmount.toFixed(2)),
        totalToReceive: Number(calculatedTotalWithInterest.toFixed(2)),
        dailyLateFee: Number(formData.dailyLateFee),
        notes: formData.notes
      });
    }

    setIsModalOpen(false);
  };

  const [filterStatus, setFilterStatus] = useState<'ativos' | 'quitados'>('ativos');

  // Helper to determine if contract is quitado (either by status or if all its installments are paid)
  const isContractQuitado = (c: typeof contracts[0]) => {
    if (c.status === 'Quitado') return true;
    const contractInsts = installments.filter(i => i.contractId === c.id);
    return contractInsts.length > 0 && contractInsts.every(i => i.status === 'Pago');
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || c.contractNumber.includes(searchTerm);
    if (!matchesSearch) return false;

    const quitado = isContractQuitado(c);
    if (filterStatus === 'quitados') {
      return quitado;
    } else {
      return !quitado;
    }
  });

  const selectedContractDetail = contracts.find(c => c.id === selectedContractId);
  const selectedContractInstallments = installments.filter(i => i.contractId === selectedContractId);

  const activeCount = contracts.filter(c => !isContractQuitado(c)).length;
  const quitadosCount = contracts.filter(c => isContractQuitado(c)).length;

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-16">
      
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus('ativos')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filterStatus === 'ativos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Em Aberto / Ativos</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            filterStatus === 'ativos' ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setFilterStatus('quitados')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            filterStatus === 'quitados'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>Contratos Quitados</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            filterStatus === 'quitados' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {quitadosCount}
          </span>
        </button>
      </div>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Buscar por cliente ou número do contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-xs"
          />
        </div>
        <button
          onClick={handleOpenModal}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Contrato</span>
        </button>
      </div>

      {/* Contracts List */}
      <div className="space-y-3">
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500 text-sm font-medium">
            {filterStatus === 'quitados' 
              ? 'Nenhum contrato quitado até o momento.' 
              : 'Nenhum contrato ativo em aberto.'}
          </div>
        ) : (
          filteredContracts.map(cnt => (
            <div 
              key={cnt.id} 
              className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">Contrato: {cnt.contractNumber}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      isContractQuitado(cnt) ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isContractQuitado(cnt) ? 'Quitado' : cnt.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 mt-1">{cnt.customerName}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditContract(cnt)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                    title="Editar Contrato"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if(confirm(`Deseja excluir o contrato Nº ${cnt.contractNumber}?`)) {
                        deleteContract(cnt.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Excluir Contrato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block">Valor Emprestado</span>
                  <span className="font-bold text-gray-800 text-sm">{formatCurrency(cnt.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Juros</span>
                  <span className="font-bold text-gray-800 text-sm">{cnt.interestRate}%</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Parcelas</span>
                  <span className="font-bold text-gray-800 text-sm">{cnt.totalInstallments}x de {formatCurrency(cnt.installmentAmount)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Total a Receber</span>
                  <span className="font-bold text-blue-700 text-sm">{formatCurrency(cnt.totalToReceive)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedContractId(cnt.id)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Detalhes e Parcelas</span>
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Contract Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-lg text-emerald-900">
                {editingContract ? `Editar Contrato: ${editingContract.contractNumber}` : `Novo Contrato: ${formData.contractNumber}`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-3 border-b border-gray-100 flex gap-2">
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Dados</span>
              </span>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-sm">
              
              <div>
                <label className="block text-gray-600 font-medium mb-1">Cliente *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                >
                  <option value="">Selecione um cliente...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Número</label>
                  <input 
                    type="text"
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Data inicial</label>
                  <input 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Valor (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="6000,00"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-bold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Juros (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    required
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-bold text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Número de parcelas</label>
                  <input 
                    type="number"
                    required
                    value={formData.totalInstallments}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: parseInt(e.target.value) || 1 })}
                    placeholder="120"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Período em dias</label>
                  <input 
                    type="number"
                    required
                    value={formData.periodDays}
                    onChange={(e) => setFormData({ ...formData, periodDays: parseInt(e.target.value) || 15 })}
                    placeholder="15"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Juros Diário por Atraso (R$/dia)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={formData.dailyLateFee}
                  onChange={(e) => setFormData({ ...formData, dailyLateFee: parseFloat(e.target.value) || 0 })}
                  placeholder="5.00"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Observação</label>
                <textarea 
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-right space-y-1 text-xs font-semibold">
                <p className="text-gray-600">Número de parcelas: <span className="font-bold text-gray-900">{formData.totalInstallments}</span></p>
                <p className="text-gray-600">Vencimento a cada (dias): <span className="font-bold text-gray-900">{formData.periodDays}</span></p>
                <p className="text-gray-600">Valor da parcelas: <span className="font-bold text-gray-900">{formatCurrency(calculatedInstallmentAmount)}</span></p>
                <p className="text-gray-600">Valor do contrato: <span className="font-bold text-red-600">{formatCurrency(formData.amount)}</span></p>
                <p className="text-gray-600 text-sm pt-1">Total à receber: <span className="font-extrabold text-blue-700">{formatCurrency(calculatedTotalWithInterest)}</span></p>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm cursor-pointer"
                >
                  {editingContract ? 'Salvar Alterações' : 'Criar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Detail & Installments Modal */}
      {selectedContractDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50/50">
              <div>
                <h3 className="font-bold text-base text-emerald-900">
                  Contrato #{selectedContractDetail.contractNumber} - {selectedContractDetail.customerName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedContractId(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-xs space-y-1">
                <p><strong>Valor Emprestado:</strong> {formatCurrency(selectedContractDetail.amount)}</p>
                <p><strong>Juros:</strong> {selectedContractDetail.interestRate}% | <strong>Total a Receber:</strong> {formatCurrency(selectedContractDetail.totalToReceive)}</p>
                <p><strong>Juros Diário por Atraso:</strong> {formatCurrency(selectedContractDetail.dailyLateFee)}/dia</p>
              </div>

              <h4 className="font-bold text-gray-800 text-sm">Lista de Parcelas ({selectedContractInstallments.length})</h4>
              
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selectedContractInstallments.map(inst => (
                  <div key={inst.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">Parcela {inst.installmentNumber}/{inst.totalInstallments}</p>
                      <p className="text-gray-500">Vencimento: {inst.dueDate.split('-').reverse().join('/')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700">{formatCurrency(inst.originalAmount)}</p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        inst.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                        inst.status === 'Atrasado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
