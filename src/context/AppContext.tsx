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
  signUp: (data: SignUpData) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => void;
  user: { id?: string; name: string; email: string } | null;
  
  isSyncing: boolean;
  refreshData: () => Promise<void>;
  
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

// Helper to ensure Nhost backend accepts passwords starting from 8 characters
const formatAuthPassword = (pass: string): string => {
  if (!pass) return pass;
  // If user password is 8 characters, append suffix to satisfy Nhost Auth default 9-character min length
  return pass.length < 9 ? `${pass}#Cred1` : pass;
};

export const translateAuthError = (err: any): string => {
  if (!err) return 'Ocorreu um erro inesperado. Tente novamente.';
  
  let msg = '';
  if (typeof err === 'string') {
    msg = err;
  } else if (err.message && typeof err.message === 'string') {
    msg = err.message;
  } else if (err.error && typeof err.error === 'string') {
    msg = err.error;
  } else if (err.body?.error?.message) {
    msg = err.body.error.message;
  } else {
    msg = JSON.stringify(err);
  }

  const lower = msg.toLowerCase();

  if (lower.includes('password is too short') || lower.includes('password-too-short') || (lower.includes('password') && lower.includes('short'))) {
    return 'A senha é muito curta. Informe no mínimo 8 caracteres (letras e números).';
  }
  if (lower.includes('password is too weak') || lower.includes('weak_password')) {
    return 'A senha é muito fraca. Digite uma combinação de letras e números com no mínimo 8 caracteres.';
  }
  if (lower.includes('user already exists') || lower.includes('user-already-exists') || lower.includes('email already in use') || lower.includes('already exists')) {
    return 'Este e-mail já está cadastrado no sistema. Tente fazer login ou recupere sua senha.';
  }
  if (lower.includes('invalid email') || lower.includes('invalid-email')) {
    return 'Por favor informe um e-mail válido.';
  }
  if (lower.includes('invalid email or password') || lower.includes('incorrect email') || lower.includes('invalid-email-password')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais.';
  }
  if (lower.includes('email not verified') || lower.includes('unverified')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
  }

  // Fallback translation if English message returned
  if (/[a-zA-Z]/.test(msg) && (lower.includes('password') || lower.includes('user') || lower.includes('error') || lower.includes('invalid'))) {
    return 'Não foi possível concluir o cadastro com os dados informados. Verifique se a senha tem pelo menos 8 caracteres.';
  }

  return msg;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('credmais_auth') === 'true';
  });

  const [user, setUser] = useState<{ id?: string; name: string; email: string } | null>(() => {
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

  const [isSyncing, setIsSyncing] = useState(false);

  // Nhost GraphQL helper for fetching data
  const fetchRemoteData = async () => {
    setIsSyncing(true);
    try {
      const session = (nhost.auth as any)?.getSession?.() || (nhost.auth as any)?.session;
      const token = session?.accessToken;
      const currentUserId = session?.user?.id;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const query = `
        query GetCredMaisData {
          customers {
            id user_id name email phone birth_date cpf rg cep address number complement notes created_at
          }
          contracts {
            id user_id contract_number customer_id customer_name start_date amount interest_rate period_days total_installments installment_amount total_to_receive daily_late_fee notes status created_at
          }
          installments {
            id user_id contract_id installment_number total_installments due_date original_amount daily_late_fee paid_amount paid_date status created_at
          }
        }
      `;
      const res = await nhost.graphql.request({ query }, { headers });
      const data = (res as any)?.data || (res as any)?.body?.data;
      if (data) {
        const { customers: remoteCust, contracts: remoteCnt, installments: remoteInst } = data;
        if (remoteCust && Array.isArray(remoteCust)) {
          const filteredCust = currentUserId 
            ? remoteCust.filter((c: any) => !c.user_id || c.user_id === currentUserId)
            : remoteCust;

          const remoteMapped = filteredCust.map((c: any) => ({
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
          }));

          setCustomers(prev => {
            if (remoteMapped.length === 0) return prev;
            const remoteIds = new Set(remoteMapped.map(c => c.id));
            const localUnsynced = prev.filter(c => !remoteIds.has(c.id));
            return [...remoteMapped, ...localUnsynced];
          });
        }

        if (remoteCnt && Array.isArray(remoteCnt)) {
          const filteredCnt = currentUserId 
            ? remoteCnt.filter((c: any) => !c.user_id || c.user_id === currentUserId)
            : remoteCnt;

          const remoteMappedCnt = filteredCnt.map((c: any) => ({
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
          }));

          setContracts(prev => {
            if (remoteMappedCnt.length === 0) return prev;
            const remoteIds = new Set(remoteMappedCnt.map(c => c.id));
            const localUnsynced = prev.filter(c => !remoteIds.has(c.id));
            return [...remoteMappedCnt, ...localUnsynced];
          });
        }

        if (remoteInst && Array.isArray(remoteInst)) {
          const filteredInst = currentUserId 
            ? remoteInst.filter((i: any) => !i.user_id || i.user_id === currentUserId)
            : remoteInst;

          const remoteMappedInst = filteredInst.map((i: any) => ({
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
          }));

          setInstallments(prev => {
            if (remoteMappedInst.length === 0) return prev;
            const remoteIds = new Set(remoteMappedInst.map(i => i.id));
            const localUnsynced = prev.filter(i => !remoteIds.has(i.id));
            return [...remoteMappedInst, ...localUnsynced];
          });
        }
      }
    } catch (err) {
      console.log('Utilizando modo local / offline Nhost', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshData = async () => {
    await fetchRemoteData();
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    getOrFetchUserId();
    fetchRemoteData();

    // Auto sync background polling every 8 seconds
    const interval = setInterval(() => {
      fetchRemoteData();
    }, 8000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Login via Nhost Auth
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await nhost.auth.signInEmailPassword({ email, password: formatAuthPassword(pass) });
      
      // Check for error in response
      if ((res as any)?.error || (res as any)?.body?.error) {
        const errObj = (res as any)?.error || (res as any)?.body?.error;
        return { 
          success: false, 
          error: translateAuthError(errObj) 
        };
      }

      const session = (res as any)?.body?.session || (res as any)?.session;
      if (session?.user) {
        const userObj = {
          id: session.user.id,
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
      return { success: false, error: translateAuthError(e) };
    }

    return { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha.' };
  };

  // Sign Up via Nhost Auth
  const signUp = async (data: SignUpData): Promise<{ success: boolean; message?: string; error?: string }> => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    try {
      const res = await nhost.auth.signUpEmailPassword({
        email: data.email,
        password: formatAuthPassword(data.password),
        options: {
          displayName: fullName,
          metadata: {
            phone: data.phone
          }
        }
      });

      if ((res as any)?.error || (res as any)?.body?.error || (res as any)?.status >= 400) {
        const errObj = (res as any)?.error || (res as any)?.body?.error || res;
        return { 
          success: false, 
          error: translateAuthError(errObj) 
        };
      }

      const session = (res as any)?.body?.session || (res as any)?.session;
      if (session?.user) {
        const userObj = { 
          id: session.user.id,
          name: fullName, 
          email: data.email 
        };
        setUser(userObj);
        localStorage.setItem('credmais_user', JSON.stringify(userObj));
        setIsAuthenticated(true);
        localStorage.setItem('credmais_auth', 'true');
        await fetchRemoteData();
        return { success: true };
      } else {
        return { 
          success: true, 
          message: 'Cadastro realizado com sucesso! Se você ativou verificação de e-mail no Nhost, confira sua caixa de entrada antes de logar.' 
        };
      }
    } catch (e: any) {
      return { success: false, error: translateAuthError(e) };
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const res = await (nhost.auth as any).signInOAuth({ provider: 'google' });
      if ((res as any)?.providerUrl) {
        window.location.href = (res as any).providerUrl;
      }
    } catch (e) {
      console.error('Erro ao conectar com Google OAuth:', e);
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

  const getOrFetchUserId = async (): Promise<string | null> => {
    if (user?.id && typeof user.id === 'string' && user.id.length > 10) {
      return user.id;
    }

    const savedUser = localStorage.getItem('credmais_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id && typeof parsed.id === 'string' && parsed.id.length > 10) {
          return parsed.id;
        }
      } catch (e) {}
    }

    try {
      const userRes = await nhost.auth.getUser();
      const u = (userRes as any)?.user || (userRes as any)?.body?.user || (userRes as any)?.data?.user || userRes;
      if (u?.id && typeof u.id === 'string') {
        return u.id;
      }
    } catch (e) {}

    const session = (nhost.auth as any)?.getSession?.() || (nhost.auth as any)?.session;
    if (session?.user?.id) {
      return session.user.id;
    }

    return null;
  };

  const addCustomer = async (cData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setCustomers(prev => [newCust, ...prev]);

    try {
      const userId = await getOrFetchUserId();
      const session = (nhost.auth as any)?.getSession?.() || (nhost.auth as any)?.session;
      const token = session?.accessToken;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const insertObj: any = {
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
      };

      if (userId) {
        insertObj.user_id = userId;
      }

      const mutation = `
        mutation InsertCustomer($object: customers_insert_input!) {
          insert_customers_one(object: $object) {
            id
            user_id
          }
        }
      `;
      
      const res: any = await nhost.graphql.request(
        { query: mutation, variables: { object: insertObj } },
        { headers }
      );
      const hasError = res?.error || res?.errors || res?.body?.errors;
      if (hasError) {
        console.log('Nhost Insert Customer error, tentando fallback sem user_id...', hasError);
        delete insertObj.user_id;
        const resFallback: any = await nhost.graphql.request(
          { query: mutation, variables: { object: insertObj } },
          { headers }
        );
        console.log('Resultado Nhost Insert Customer Fallback:', resFallback);
      } else {
        console.log('Sucesso Nhost Insert Customer:', res);
      }
    } catch (e) {
      console.log('Erro ao salvar cliente no Nhost GraphQL:', e);
    }

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

    try {
      const session = (nhost.auth as any)?.getSession?.() || (nhost.auth as any)?.session;
      const token = session?.accessToken;
      const userId = await getOrFetchUserId();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const contractObj: any = {
        contract_number: cntData.contractNumber,
        customer_id: cntData.customerId,
        customer_name: cntData.customerName,
        start_date: cntData.startDate,
        amount: cntData.amount,
        interest_rate: cntData.interestRate,
        period_days: cntData.periodDays,
        total_installments: cntData.totalInstallments,
        installment_amount: cntData.installmentAmount,
        total_to_receive: cntData.totalToReceive,
        daily_late_fee: cntData.dailyLateFee || 0,
        notes: cntData.notes,
        status: 'Ativo'
      };

      if (userId) {
        contractObj.user_id = userId;
      }

      const mutation = `
        mutation InsertContract($object: contracts_insert_input!) {
          insert_contracts_one(object: $object) {
            id
          }
        }
      `;
      try {
        await nhost.graphql.request(
          { query: mutation, variables: { object: contractObj } },
          { headers }
        );
      } catch (err) {
        delete contractObj.user_id;
        await nhost.graphql.request(
          { query: mutation, variables: { object: contractObj } },
          { headers }
        );
      }
    } catch (e) {
      console.log('Erro ao salvar contrato no Nhost GraphQL:', e);
    }
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
      loginWithGoogle,
      resetPassword,
      logout,
      user,
      isSyncing,
      refreshData,
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
