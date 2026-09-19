import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Customer, Contract, Installment } from '../types';
import { initialCustomers, initialContracts, initialInstallments } from '../data/initialData';

interface AppContextType {
  isAuthenticated: boolean;
  login: (u: string, p: string) => boolean;
  logout: () => void;
  user: { name: string; email: string } | null;
  
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  contracts: Contract[];
  addContract: (c: Omit<Contract, 'id' | 'createdAt' | 'status'>) => void;
  updateContract: (c: Contract) => void;
  deleteContract: (id: string) => void;
  
  installments: Installment[];
  payInstallment: (params: {
    installmentId: string;
    type: 'TOTAL' | 'JUROS' | 'PARCIAL';
    amountPaid: number;
    newDueDate?: string;
    applyDailyFee?: boolean;
    feeDays?: number;
    note?: string;
  }) => void;
  
  calculateLateFee: (installment: Installment) => number;
  formatCurrency: (val: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('credmais_auth') === 'true';
  });

  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('credmais_user');
    return saved ? JSON.parse(saved) : { name: 'Marcos Paulo', email: 'admin@credmais.com' };
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('credmais_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('credmais_contracts');
    return saved ? JSON.parse(saved) : initialContracts;
  });

  const [installments, setInstallments] = useState<Installment[]>(() => {
    const saved = localStorage.getItem('credmais_installments');
    return saved ? JSON.parse(saved) : initialInstallments;
  });

  useEffect(() => {
    localStorage.setItem('credmais_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('credmais_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('credmais_installments', JSON.stringify(installments));
  }, [installments]);

  const login = (u: string, p: string) => {
    if (u && p) {
      setIsAuthenticated(true);
      localStorage.setItem('credmais_auth', 'true');
      const uObj = { name: 'Marcos Paulo', email: u };
      setUser(uObj);
      localStorage.setItem('credmais_user', JSON.stringify(uObj));
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('credmais_auth');
  };

  const addCustomer = (cData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addContract = (cntData: Omit<Contract, 'id' | 'createdAt' | 'status'>) => {
    const newId = `cnt-${Date.now()}`;
    const newContract: Contract = {
      ...cntData,
      id: newId,
      status: 'Ativo',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const newInstallments: Installment[] = [];
    const baseDate = new Date(cntData.startDate);

    for (let i = 1; i <= cntData.totalInstallments; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(baseDate.getDate() + (i * cntData.periodDays));

      newInstallments.push({
        id: `inst-${newId}-${i}`,
        contractId: newId,
        installmentNumber: i,
        totalInstallments: cntData.totalInstallments,
        dueDate: dueDate.toISOString().split('T')[0],
        originalAmount: cntData.installmentAmount,
        dailyLateFee: cntData.dailyLateFee || 0,
        paidAmount: 0,
        status: 'A vencer'
      });
    }

    setContracts(prev => [newContract, ...prev]);
    setInstallments(prev => [...newInstallments, ...prev]);
  };

  const updateContract = (updated: Contract) => {
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    setInstallments(prev => prev.filter(i => i.contractId !== id));
  };

  const calculateLateFee = (inst: Installment): number => {
    if (inst.status === 'Pago') return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(inst.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && inst.dailyLateFee > 0) {
      return diffDays * inst.dailyLateFee;
    }
    return 0;
  };

  const payInstallment = ({
    installmentId,
    type,
    amountPaid,
    newDueDate,
    note
  }: {
    installmentId: string;
    type: 'TOTAL' | 'JUROS' | 'PARCIAL';
    amountPaid: number;
    newDueDate?: string;
    applyDailyFee?: boolean;
    feeDays?: number;
    note?: string;
  }) => {
    setInstallments(prev => prev.map(inst => {
      if (inst.id !== installmentId) return inst;

      const todayStr = new Date().toISOString().split('T')[0];
      const historyEntry = {
        date: todayStr,
        type: type === 'TOTAL' ? 'QUITAÇÃO_TOTAL' as const : type === 'JUROS' ? 'PAGAMENTO_JUROS' as const : 'PAGAMENTO_PARCIAL' as const,
        amountPaid,
        newDueDate,
        note
      };

      const updatedHistory = [...(inst.history || []), historyEntry];

      if (type === 'TOTAL') {
        return {
          ...inst,
          paidAmount: inst.originalAmount,
          paidDate: todayStr,
          status: 'Pago',
          history: updatedHistory
        };
      }

      if (type === 'JUROS') {
        return {
          ...inst,
          dueDate: newDueDate || inst.dueDate,
          status: 'A vencer',
          history: updatedHistory
        };
      }

      if (type === 'PARCIAL') {
        const newPaidAmount = inst.paidAmount + amountPaid;
        const isFullyPaid = newPaidAmount >= inst.originalAmount;
        return {
          ...inst,
          paidAmount: newPaidAmount,
          paidDate: isFullyPaid ? todayStr : undefined,
          dueDate: newDueDate || inst.dueDate,
          status: isFullyPaid ? 'Pago' : 'Pago Parcial',
          history: updatedHistory
        };
      }

      return inst;
    }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      user,
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      contracts,
      addContract,
      updateContract,
      deleteContract,
      installments,
      payInstallment,
      calculateLateFee,
      formatCurrency
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
