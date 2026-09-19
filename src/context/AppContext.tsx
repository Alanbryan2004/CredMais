import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Customer, Contract, Installment } from '../types';
import { nhost } from '../lib/nhost';

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
  user: { name: string; email: string } | null;
  
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  contracts: Contract[];
  addContract: (c: Omit<Contract, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateContract: (c: Contract) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  
  installments: Installment[];
  payInstallment: (params: {
    installmentId: string;
    type: 'TOTAL' | 'JUROS' | 'PARCIAL';
    amountPaid: number;
    newDueDate?: string;
    applyDailyFee?: boolean;
    feeDays?: number;
    note?: string;
  }) => Promise<void>;
  
  calculateLateFee: (installment: Installment) => number;
  formatCurrency: (val: number) => string;
  fetchRemoteData: () => Promise<void>;
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
    return saved ? JSON.parse(saved) : [];
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('credmais_contracts');
    return saved ? JSON.parse(saved) : [];
  });

  const [installments, setInstallments] = useState<Installment[]>(() => {
    const saved = localStorage.getItem('credmais_installments');
    return saved ? JSON.parse(saved) : [];
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

  // Nhost GraphQL helper for fetching data
  const fetchRemoteData = async () => {
    try {
      const query = `
        query GetCredMaisData {
          customers {
            id name email phone birth_date cpf rg cep address number complement notes created_at
          }
          contracts {
            id contract_number customer_id customer_name start_date amount interest_rate period_days total_installments installment_amount total_to_receive daily_late_fee notes status created_at
          }
          installments {
            id contract_id installment_number total_installments due_date original_amount daily_late_fee paid_amount paid_date status created_at
          }
        }
      `;
      const res = await nhost.graphql.request({ query });
      if (res && (res as any).body?.data) {
        const { customers: remoteCust, contracts: remoteCnt, installments: remoteInst } = (res as any).body.data;
        if (remoteCust && remoteCust.length > 0) {
          setCustomers(remoteCust.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
            birthDate: c.birth_date || '',
            cpf: c.cpf || '',
            rg: c.rg || '',
            cep: c.cep || '',
            address: c.address || '',
            number: c.number || '',
            complement: c.complement || '',
            notes: c.notes || '',
            createdAt: c.created_at
          })));
        }

        if (remoteCnt && remoteCnt.length > 0) {
          setContracts(remoteCnt.map((c: any) => ({
            id: c.id,
            contractNumber: c.contract_number,
            customerId: c.customer_id,
            customerName: c.customer_name,
            startDate: c.start_date,
            amount: Number(c.amount),
            interestRate: Number(c.interest_rate),
            periodDays: Number(c.period_days),
            totalInstallments: Number(c.total_installments),
            installmentAmount: Number(c.installment_amount),
            totalToReceive: Number(c.total_to_receive),
            dailyLateFee: Number(c.daily_late_fee),
            notes: c.notes || '',
            status: c.status,
            createdAt: c.created_at
          })));
        }

        if (remoteInst && remoteInst.length > 0) {
          setInstallments(remoteInst.map((i: any) => ({
            id: i.id,
            contractId: i.contract_id,
            installmentNumber: i.installment_number,
            totalInstallments: i.total_installments,
            dueDate: i.due_date,
            originalAmount: Number(i.original_amount),
            dailyLateFee: Number(i.daily_late_fee),
            paidAmount: Number(i.paid_amount || 0),
            paidDate: i.paid_date || undefined,
            status: i.status
          })));
        }
      }
    } catch (err) {
      console.log('Utilizando modo local / offline Nhost');
    }
  };

  useEffect(() => {
    fetchRemoteData();
  }, []);

  // Login via Nhost Auth
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await nhost.auth.signInEmailPassword({ email, password: pass });
      
      // Check for error in response
      if ((res as any)?.error || (res as any)?.body?.error) {
        const errObj = (res as any)?.error || (res as any)?.body?.error;
        return { 
          success: false, 
          error: errObj.message || 'E-mail ou senha incorretos. Verifique suas credenciais.' 
        };
      }

      const session = (res as any)?.body?.session || (res as any)?.session;
      if (session?.user) {
        const userObj = {
          name: session.user.displayName || email.split('@')[0],
          email: session.user.email || email
        };
        setUser(userObj);
        localStorage.setItem('credmais_user', JSON.stringify(userObj));
        setIsAuthenticated(true);
        localStorage.setItem('credmais_auth', 'true');
        await fetchRemoteData();
        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Falha ao conectar ao servidor Nhost.' };
    }

    return { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha.' };
  };

  // Sign Up via Nhost Auth
  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    try {
      const res = await nhost.auth.signUpEmailPassword({
        email: data.email,
        password: data.password,
        options: {
          displayName: fullName,
          metadata: {
            phone: data.phone
          }
        }
      });

      if ((res as any)?.error || (res as any)?.body?.error) {
        const errObj = (res as any)?.error || (res as any)?.body?.error;
        let errMsg = errObj.message || 'Erro ao realizar cadastro no Nhost.';
        
        if (errMsg.toLowerCase().includes('password is too short') || errObj.error === 'password-too-short') {
          errMsg = 'A senha é muito curta. Informe no mínimo 8 caracteres (letras e números).';
        } else if (errMsg.toLowerCase().includes('user already exists') || errObj.error === 'user-already-exists') {
          errMsg = 'Este e-mail já está cadastrado no sistema.';
        } else if (errMsg.toLowerCase().includes('invalid email') || errObj.error === 'invalid-email-password') {
          errMsg = 'Por favor informe um e-mail válido.';
        }
        
        return { 
          success: false, 
          error: errMsg 
        };
      }

      const session = (res as any)?.body?.session || (res as any)?.session;
      if (session?.user) {
        const userObj = { name: fullName, email: data.email };
        setUser(userObj);
        localStorage.setItem('credmais_user', JSON.stringify(userObj));
        setIsAuthenticated(true);
        localStorage.setItem('credmais_auth', 'true');
        await fetchRemoteData();
        return { success: true };
      } else {
        return { 
          success: true, 
          error: 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de entrar.' 
        };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao conectar ao servidor de cadastro.' };
    }
  };

  // Password Recovery via Nhost Auth
  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await nhost.auth.sendPasswordResetEmail({ email });
      if (res && !(res as any).error) {
        return { success: true, message: 'Link para redefinição de senha enviado para seu e-mail!' };
      } else if (res && (res as any).error) {
        return { success: false, error: (res as any).error.message };
      }
    } catch (e: any) {
      console.log('Nhost Reset Password offline fallback');
    }

    return { 
      success: true, 
      message: 'Instruções para recuperação de senha foram enviadas para o seu e-mail!' 
    };
  };

  const logout = async () => {
    try {
      await nhost.auth.signOut({});
    } catch (e) {}
    setIsAuthenticated(false);
    setUser(null);
    setCustomers([]);
    setContracts([]);
    setInstallments([]);
    localStorage.removeItem('credmais_auth');
    localStorage.removeItem('credmais_user');
    localStorage.removeItem('credmais_customers');
    localStorage.removeItem('credmais_contracts');
    localStorage.removeItem('credmais_installments');
  };

  const addCustomer = async (cData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCustomers(prev => [newCust, ...prev]);

    try {
      const mutation = `
        mutation InsertCustomer($object: customers_insert_input!) {
          insert_customers_one(object: $object) {
            id
          }
        }
      `;
      await nhost.graphql.request({
        query: mutation,
        variables: {
          object: {
            name: cData.name,
            email: cData.email,
            phone: cData.phone,
            birth_date: cData.birthDate || null,
            cpf: cData.cpf,
            rg: cData.rg,
            cep: cData.cep,
            address: cData.address,
            number: cData.number,
            complement: cData.complement,
            notes: cData.notes
          }
        }
      });
    } catch (e) {}

    return newCust;
  };

  const updateCustomer = async (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addContract = async (cntData: Omit<Contract, 'id' | 'createdAt' | 'status'>) => {
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

  const updateContract = async (updated: Contract) => {
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteContract = async (id: string) => {
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

  const payInstallment = async ({
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
      signUp,
      resetPassword,
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
      formatCurrency,
      fetchRemoteData
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
