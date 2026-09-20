import React, { useState } from 'react';
import { Plus, Search, Phone, MapPin, Edit, Trash2, X, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Customer } from '../types';

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [diagModal, setDiagModal] = useState<{
    isOpen: boolean;
    success: boolean;
    title: string;
    error?: string;
    payloadSent?: any;
    copied?: boolean;
  }>({
    isOpen: false,
    success: false,
    title: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    cpf: '',
    rg: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    notes: ''
  });

  const handleOpenModal = (cust?: Customer) => {
    if (cust) {
      setSelectedCustomer(cust);
      setFormData({
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        birthDate: cust.birthDate || '',
        cpf: cust.cpf || '',
        rg: cust.rg || '',
        cep: cust.cep || '',
        address: cust.address || '',
        number: cust.number || '',
        complement: cust.complement || '',
        notes: cust.notes || ''
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        cpf: '',
        rg: '',
        cep: '',
        address: '',
        number: '',
        complement: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      if (!formData.name || !formData.phone) {
        setDiagModal({
          isOpen: true,
          success: false,
          title: 'Formulário Incompleto',
          error: 'Por favor informe pelo menos o Nome e Telefone do cliente.'
        });
        return;
      }

      if (selectedCustomer) {
        await updateCustomer({
          ...selectedCustomer,
          ...formData
        });
        setIsModalOpen(false);
      } else {
        const result = await addCustomer(formData);
        if (result && result.success) {
          setIsModalOpen(false);
          setDiagModal({
            isOpen: true,
            success: true,
            title: '✅ CLIENTE SALVO NO BANCO COM SUCESSO!',
            payloadSent: result.payloadSent
          });
        } else {
          setDiagModal({
            isOpen: true,
            success: false,
            title: '❌ FALHA AO SALVAR NO BANCO NHOST',
            error: result?.error || 'Erro desconhecido ao comunicar com Nhost GraphQL',
            payloadSent: result?.payloadSent
          });
        }
      }
    } catch (err: any) {
      setDiagModal({
        isOpen: true,
        success: false,
        title: '❌ EXCEÇÃO NO APLICATIVO',
        error: err?.message || JSON.stringify(err)
      });
    }
  };

  const handleCopyDiag = () => {
    const fullText = `TITULO: ${diagModal.title}\n\nERRO DO BANCO:\n${diagModal.error || 'Nenhum erro'}\n\nDADOS ENVIADOS:\n${JSON.stringify(diagModal.payloadSent, null, 2)}`;
    navigator.clipboard.writeText(fullText);
    setDiagModal(prev => ({ ...prev, copied: true }));
    setTimeout(() => {
      setDiagModal(prev => ({ ...prev, copied: false }));
    }, 2000);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.cpf && c.cpf.includes(searchTerm))
  );

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto pb-16">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Buscar por cliente, telefone ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-xs"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-100 shadow-xs">
            Nenhum cliente cadastrado ainda.
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div key={cust.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{cust.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cust.email || 'Sem e-mail'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(cust)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteCustomer(cust.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate font-medium">{cust.phone}</span>
                </div>
                {cust.rg && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-500">RG:</span>
                    <span>{cust.rg}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{cust.address ? `${cust.address}, ${cust.number || ''}` : 'Endereço não informado'}</span>
                </div>
                {cust.cpf && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-500">CPF:</span>
                    <span>{cust.cpf}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-lg text-emerald-900">
                {selectedCustomer ? selectedCustomer.name : 'Novo Cliente'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-sm">
              <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs border-b pb-1">Identificação</h4>
              
              <div>
                <label className="block text-gray-600 font-medium mb-1">Nome *</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo do cliente"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Telefone *</label>
                  <input 
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Nascimento</label>
                  <input 
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">CPF</label>
                  <input 
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">RG</label>
                  <input 
                    type="text"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="RG"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs border-b pb-1 pt-2">Endereço</h4>

              <div>
                <label className="block text-gray-600 font-medium mb-1">CEP</label>
                <input 
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-600 font-medium mb-1">Endereço</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua / Avenida"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Número</label>
                  <input 
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="Nº"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Complemento</label>
                <input 
                  type="text"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apartamento, Bloco, etc."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleSave(e)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Diagnostic Results Modal */}
      {diagModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className={`p-4 border-b flex items-center justify-between ${diagModal.success ? 'bg-emerald-900/40 border-emerald-500/30' : 'bg-rose-900/40 border-rose-500/30'}`}>
              <div className="flex items-center gap-2">
                {diagModal.success ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <h3 className={`font-bold text-base ${diagModal.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {diagModal.title}
                </h3>
              </div>
              <button 
                onClick={() => setDiagModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
              {diagModal.error && (
                <div className="space-y-1">
                  <div className="text-slate-400 font-sans font-semibold text-xs">MOTIVO / ERRO DETALHADO DO BANCO:</div>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-rose-300 overflow-x-auto whitespace-pre-wrap">
                    {diagModal.error}
                  </pre>
                </div>
              )}

              {diagModal.payloadSent && (
                <div className="space-y-1">
                  <div className="text-slate-400 font-sans font-semibold text-xs">DADOS ENVIADOS NA REQUISIÇÃO:</div>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(diagModal.payloadSent, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <button
                onClick={handleCopyDiag}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-sans text-xs font-semibold transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {diagModal.copied ? 'Copiado para a área de transferência!' : 'Copiar Diagnóstico Completo'}
              </button>

              <button
                onClick={() => setDiagModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-sans text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
