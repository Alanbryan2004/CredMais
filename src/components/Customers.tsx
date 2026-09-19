import React, { useState } from 'react';
import { Plus, Search, Phone, MapPin, Edit, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Customer } from '../types';

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Por favor informe pelo menos o Nome e Telefone do Cliente.');
      return;
    }

    if (selectedCustomer) {
      updateCustomer({
        ...selectedCustomer,
        ...formData
      });
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
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
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 text-gray-500">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredCustomers.map(cust => (
            <div 
              key={cust.id} 
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base">
                    {cust.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{cust.name}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{cust.phone}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(cust)}
                    className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm(`Deseja realmente remover o cliente ${cust.name}?`)) {
                        deleteCustomer(cust.id);
                      }
                    }}
                    className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-sm cursor-pointer"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
