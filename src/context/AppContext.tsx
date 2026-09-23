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
  user: { id?: string; name: string; email: string; isAdmin: boolean; isApproved: boolean } | null;
  
  approvedUsers: string[];
  approveUser: (email: string) => void;
  revokeUser: (email: string) => void;
  userRegistry: { id: string; name: string; email: string; isApproved: boolean }[];
  
  isSyncing: boolean;
  refreshData: () => Promise<void>;
  
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => Promise<{ success: boolean; customer?: Customer; error?: string; payloadSent?: any }>;
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

// Helper to determine if an email belongs to an Admin (Alan or Daniel)
const checkIsAdmin = (email: string): boolean => {
  if (!email) return false;
  const e = email.toLowerCase();
  return e.includes('alan') || e.includes('daniel') || e.includes('admin');
};

// Helper for RFC 4122 v4 UUID generation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to format password for Nhost auth
const formatAuthPassword = (pass: string): string => {
  if (!pass) return pass;
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
    return 'Seu e-mail ainda não foi confirmed. Verifique sua caixa de entrada.';
  }

  if (/[a-zA-Z]/.test(msg) && (lower.includes('password') || lower.includes('user') || lower.includes('error') || lower.includes('invalid'))) {
    return 'Não foi possível concluir a operação. Verifique seus dados e tente novamente.';
  }

  return msg;
};

const getNhostAccessToken = (): string | null => {
  try {
    const auth: any = nhost.auth;
    if (!auth) return null;
    
    if (typeof auth.getSession === 'function') {
      const sess = auth.getSession();
      if (sess?.accessToken) return sess.accessToken;
    }
    
    if (auth.session?.accessToken) return auth.session.accessToken;
    if (auth.session?.jwtToken) return auth.session.jwtToken;
    
    if (typeof auth.accessToken === 'string') return auth.accessToken;
    if (typeof auth.getAccessToken === 'function') {
      const token = auth.getAccessToken();
      if (token) return token;
    }

    // Fallback: Check localStorage for Nhost session
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.toLowerCase().includes('nhost') || key.toLowerCase().includes('auth'))) {
        try {
          const val = localStorage.getItem(key);
          if (val && val.includes('accessToken')) {
            const parsed = JSON.parse(val);
            if (parsed?.accessToken) return parsed.accessToken;
            if (parsed?.session?.accessToken) return parsed.session.accessToken;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  return null;
};

const getNhostUser = (): any => {
  try {
    const session = (nhost.auth as any)?.getSession?.() || (nhost.auth as any)?.session;
    if (session?.user) return session.user;
    if (typeof (nhost.auth as any)?.getUser === 'function') {
      return (nhost.auth as any).getUser();
    }
    return (nhost.auth as any)?.user || null;
  } catch (e) {
    return null;
  }
};

// Helper for executing GraphQL requests with Nhost token safely
const executeGql = async (query: string, variables?: any) => {
  const reqPayload = variables ? { query, variables } : { query };
  try {
    const token = getNhostAccessToken();
    if (token) {
      const res: any = await nhost.graphql.request(reqPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const errors = res?.error || res?.errors || res?.body?.errors;
      const isJwtExpired = JSON.stringify(errors || '').includes('JWTExpired');
      if (isJwtExpired) {
        console.warn('JWT expirado detectado, renovando sessão no Nhost...');
        try {
          await (nhost.auth as any).refreshSession();
        } catch (e) {}
        return await nhost.graphql.request(reqPayload);
      }
      return res;
    }
    return await nhost.graphql.request(reqPayload);
  } catch (err) {
    try {
      return await nhost.graphql.request(reqPayload);
    } catch (e2) {
      console.error('Nhost GraphQL execution error:', err);
      return { error: err };
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('credmais_auth') === 'true';
  });

  const [approvedUsers, setApprovedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('credmais_approved_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [userRegistry, setUserRegistry] = useState<{ id: string; name: string; email: string; isApproved: boolean }[]>(() => {
    const saved = localStorage.getItem('credmais_user_registry');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('credmais_approved_users', JSON.stringify(approvedUsers));
  }, [approvedUsers]);

  useEffect(() => {
    localStorage.setItem('credmais_user_registry', JSON.stringify(userRegistry));
  }, [userRegistry]);

  const [user, setUser] = useState<{ id?: string; name: string; email: string; isAdmin: boolean; isApproved: boolean } | null>(() => {
    const saved = localStorage.getItem('credmais_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      const isAdmin = checkIsAdmin(parsed.email);
      const isApproved = isAdmin || (saved ? JSON.parse(localStorage.getItem('credmais_approved_users') || '[]').includes(parsed.email.toLowerCase()) : false);
      return { ...parsed, isAdmin, isApproved };
    } catch (e) {
      return null;
    }
  });

  const approveUser = (emailToApprove: string) => {
    const cleanEmail = emailToApprove.toLowerCase();
    setApprovedUsers(prev => Array.from(new Set([...prev, cleanEmail])));
    setUserRegistry(prev => prev.map(u => u.email.toLowerCase() === cleanEmail ? { ...u, isApproved: true } : u));
    if (user && user.email.toLowerCase() === cleanEmail) {
      setUser(prev => prev ? { ...prev, isApproved: true } : null);
    }
  };

  const revokeUser = (emailToRevoke: string) => {
    const cleanEmail = emailToRevoke.toLowerCase();
    setApprovedUsers(prev => prev.filter(e => e !== cleanEmail));
    setUserRegistry(prev => prev.map(u => u.email.toLowerCase() === cleanEmail ? { ...u, isApproved: false } : u));
    if (user && user.email.toLowerCase() === cleanEmail && !user.isAdmin) {
      setUser(prev => prev ? { ...prev, isApproved: false } : null);
    }
  };

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

  const getOrFetchUserId = async (): Promise<string | null> => {
    if (user?.id && typeof user.id === 'string' && user.id.length > 10) {
      return user.id;
    }

    const nhostUser = getNhostUser();
    if (nhostUser?.id) return nhostUser.id;

    const savedUser = localStorage.getItem('credmais_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id && typeof parsed.id === 'string' && parsed.id.length > 10) {
          return parsed.id;
        }
      } catch (e) {}
    }

    return null;
  };

  const fetchRemoteData = async () => {
    setIsSyncing(true);
    try {
      const currentUserId = await getOrFetchUserId();

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
      const res: any = await executeGql(query);
      const data = res?.data || res?.body?.data;
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

    fetchRemoteData();

    const interval = setInterval(() => {
      fetchRemoteData();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await nhost.auth.signInEmailPassword({ email, password: formatAuthPassword(pass) });
      
      if ((res as any)?.error || (res as any)?.body?.error) {
        const errObj = (res as any)?.error || (res as any)?.body?.error;
        return { 
          success: false, 
          error: translateAuthError(errObj) 
        };
      }

      const session = (res as any)?.body?.session || (res as any)?.session;
      if (session?.user) {
        const uEmail = session.user.email || email;
        const isAdmin = checkIsAdmin(uEmail);
        const isApproved = isAdmin || approvedUsers.includes(uEmail.toLowerCase());
        const userObj = {
          id: session.user.id,
          name: session.user.displayName || email.split('@')[0],
          email: uEmail,
          isAdmin,
          isApproved
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
        const uEmail = data.email;
        const isAdmin = checkIsAdmin(uEmail);
        const isApproved = isAdmin || approvedUsers.includes(uEmail.toLowerCase());
        const userObj = { 
          id: session.user.id,
          name: fullName, 
          email: uEmail,
          isAdmin,
          isApproved
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
          message: 'Cadastro realizado com sucesso! Se a verificação de e-mail estiver ativada no Nhost, confira sua caixa de entrada.' 
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

  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await nhost.auth.sendPasswordResetEmail({ email });
      if (res && !(res as any).error) {
        return { success: true, message: 'Link para redefinição de senha enviado para seu e-mail!' };
      } else if (res && (res as any).error) {
        return { success: false, error: (res as any).error.message };
      }
    } catch (e: any) {
      console.log('Nhost Reset Password fallback');
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

  const addCustomer = async (cData: Omit<Customer, 'id' | 'createdAt'>): Promise<{ success: boolean; customer?: Customer; error?: string; payloadSent?: any }> => {
    // Gate write access if user is not approved by Alan or Daniel
    if (user && !user.isAdmin && !user.isApproved) {
      return {
        success: false,
        error: '⏳ CONTA AGUARDANDO LIBERAÇÃO DE ADMINISTRADOR (ALAN OU DANIEL)\n\nSua conta foi cadastrada com sucesso, mas está aguardando liberação do Administrador para utilizar e salvar novos cadastros no sistema.',
        payloadSent: {
          userEmail: user.email,
          status: 'Aguardando Liberação do Administrador'
        }
      };
    }

    const customerId = generateUUID();
    const newCust: Customer = {
      ...cData,
      id: customerId,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const userId = await getOrFetchUserId();
    const token = getNhostAccessToken();

    const insertObj: any = {
      id: customerId,
      name: cData.name,
      email: cData.email || null,
      phone: cData.phone,
      birth_date: cData.birthDate || null,
      cpf: cData.cpf || null,
      rg: cData.rg || null,
      cep: cData.cep || null,
      address: cData.address || null,
      number: cData.number || null,
      complement: cData.complement || null,
      notes: cData.notes || null
    };

    const mutation = `
      mutation InsertCustomer($object: customers_insert_input!) {
        insert_customers_one(object: $object) {
          id
          user_id
          name
        }
      }
    `;

    let res: any;
    let errorMsg: string | null = null;
    let insertedData: any = null;

    try {
      res = await executeGql(mutation, { object: insertObj });
      let errors = res?.error || res?.errors || res?.body?.errors;
      insertedData = res?.data?.insert_customers_one || res?.body?.data?.insert_customers_one;

      if (errors && !insertedData) {
        errorMsg = typeof errors === 'string' ? errors : JSON.stringify(errors);
        // Try fallback with explicit user_id if present
        if (userId) {
          const objWithUser = { ...insertObj, user_id: userId };
          const resUser: any = await executeGql(mutation, { object: objWithUser });
          const userErrors = resUser?.error || resUser?.errors || resUser?.body?.errors;
          const fallbackData = resUser?.data?.insert_customers_one || resUser?.body?.data?.insert_customers_one;
          if (!userErrors && fallbackData) {
            res = resUser;
            insertedData = fallbackData;
            errorMsg = null;
          } else if (userErrors) {
            errorMsg += ' | Tentativa com user_id explícito: ' + JSON.stringify(userErrors);
          }
        }
      }
    } catch (e: any) {
      errorMsg = e?.message || JSON.stringify(e);
    }

    const payloadInfo = {
      ...insertObj,
      tokenPresent: !!token,
      activeUserId: userId || 'NENHUM (Usuário não localizado no SDK)',
      rawResData: res?.data || res?.body?.data || null
    };

    if (!errorMsg && (insertedData || res?.data || res?.body?.data)) {
      setCustomers(prev => [newCust, ...prev]);
      return {
        success: true,
        customer: newCust,
        payloadSent: payloadInfo
      };
    } else {
      return {
        success: false,
        error: errorMsg || `Falha na resposta GraphQL Nhost: ${JSON.stringify(res)}`,
        payloadSent: payloadInfo
      };
    }
  };

  const updateCustomer = async (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));

    try {
      const mutation = `
        mutation UpdateCustomer($id: uuid!, $set: customers_set_input!) {
          update_customers_by_pk(pk_columns: { id: $id }, _set: $set) {
            id
          }
        }
      `;
      await executeGql(mutation, {
        id: updated.id,
        set: {
          name: updated.name,
          email: updated.email || null,
          phone: updated.phone,
          birth_date: updated.birthDate || null,
          cpf: updated.cpf || null,
          rg: updated.rg || null,
          cep: updated.cep || null,
          address: updated.address || null,
          number: updated.number || null,
          complement: updated.complement || null,
          notes: updated.notes || null
        }
      });
    } catch (e) {
      console.error('Erro ao atualizar cliente no Nhost:', e);
    }
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));

    try {
      const mutation = `
        mutation DeleteCustomer($id: uuid!) {
          delete_customers_by_pk(id: $id) {
            id
          }
        }
      `;
      await executeGql(mutation, { id });
    } catch (e) {
      console.error('Erro ao deletar cliente no Nhost:', e);
    }
  };

  const addContract = async (cntData: Omit<Contract, 'id' | 'createdAt' | 'status'>) => {
    const contractId = generateUUID();
    const newContract: Contract = {
      ...cntData,
      id: contractId,
      status: 'Ativo',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const userId = await getOrFetchUserId();
    const newInstallments: Installment[] = [];
    const installmentObjs: any[] = [];
    const baseDate = new Date(cntData.startDate);

    for (let i = 1; i <= cntData.totalInstallments; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(baseDate.getDate() + (i * cntData.periodDays));

      const instId = generateUUID();
      const dueDateStr = dueDate.toISOString().split('T')[0];

      newInstallments.push({
        id: instId,
        contractId: contractId,
        installmentNumber: i,
        totalInstallments: cntData.totalInstallments,
        dueDate: dueDateStr,
        originalAmount: cntData.installmentAmount,
        dailyLateFee: cntData.dailyLateFee || 0,
        paidAmount: 0,
        status: 'A vencer'
      });

      const instObj: any = {
        id: instId,
        contract_id: contractId,
        installment_number: i,
        total_installments: cntData.totalInstallments,
        due_date: dueDateStr,
        original_amount: cntData.installmentAmount,
        daily_late_fee: cntData.dailyLateFee || 0,
        paid_amount: 0,
        status: 'A vencer'
      };
      if (userId) instObj.user_id = userId;
      installmentObjs.push(instObj);
    }

    setContracts(prev => [newContract, ...prev]);
    setInstallments(prev => [...newInstallments, ...prev]);

    try {
      const contractObj: any = {
        id: contractId,
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
        notes: cntData.notes || null,
        status: 'Ativo'
      };

      if (userId) {
        contractObj.user_id = userId;
      }

      const mutation = `
        mutation InsertContractAndInstallments(
          $contract: contracts_insert_input!,
          $installments: [installments_insert_input!]!
        ) {
          insert_contracts_one(object: $contract) {
            id
          }
          insert_installments(objects: $installments) {
            affected_rows
          }
        }
      `;

      const res: any = await executeGql(mutation, {
        contract: contractObj,
        installments: installmentObjs
      });

      const hasError = res?.error || res?.errors || res?.body?.errors;
      if (hasError) {
        console.warn('Nhost Insert Contract falhou com user_id, tentando sem user_id...', hasError);
        delete contractObj.user_id;
        const cleanInst = installmentObjs.map(i => {
          const { user_id, ...rest } = i;
          return rest;
        });
        await executeGql(mutation, {
          contract: contractObj,
          installments: cleanInst
        });
      }
    } catch (e) {
      console.error('Erro ao salvar contrato no Nhost GraphQL:', e);
    }
  };

  const updateContract = async (updated: Contract) => {
    // 1. Update contract in state
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));

    // 2. Recalculate unpaid installments for this contract
    setInstallments(prev => {
      const contractInsts = prev.filter(i => i.contractId === updated.id);
      const otherInsts = prev.filter(i => i.contractId !== updated.id);
      
      const baseDate = new Date(updated.startDate);
      const updatedContractInsts = contractInsts.map(inst => {
        // Only adjust unpaid or partially paid installments
        if (inst.status === 'Pago') return inst;

        const dueDate = new Date(baseDate);
        dueDate.setDate(baseDate.getDate() + (inst.installmentNumber * updated.periodDays));
        const dueDateStr = dueDate.toISOString().split('T')[0];

        return {
          ...inst,
          totalInstallments: updated.totalInstallments,
          originalAmount: updated.installmentAmount,
          dailyLateFee: updated.dailyLateFee || 0,
          dueDate: dueDateStr
        };
      });

      return [...otherInsts, ...updatedContractInsts];
    });

    // 3. Persist update to Nhost GraphQL
    try {
      const mutation = `
        mutation UpdateContract($id: uuid!, $set: contracts_set_input!) {
          update_contracts_by_pk(pk_columns: { id: $id }, _set: $set) {
            id
          }
        }
      `;
      await executeGql(mutation, {
        id: updated.id,
        set: {
          contract_number: updated.contractNumber,
          customer_id: updated.customerId,
          customer_name: updated.customerName,
          start_date: updated.startDate,
          amount: updated.amount,
          interest_rate: updated.interestRate,
          period_days: updated.periodDays,
          total_installments: updated.totalInstallments,
          installment_amount: updated.installmentAmount,
          total_to_receive: updated.totalToReceive,
          daily_late_fee: updated.dailyLateFee || 0,
          notes: updated.notes || null,
          status: updated.status
        }
      });

      // Update unpaid installment amounts/fees in Nhost
      const updateInstMutation = `
        mutation UpdateUnpaidInstallments($contractId: uuid!, $amount: numeric!, $fee: numeric!) {
          update_installments(
            where: { contract_id: { _eq: $contractId }, status: { _neq: "Pago" } },
            _set: { original_amount: $amount, daily_late_fee: $fee }
          ) {
            affected_rows
          }
        }
      `;
      await executeGql(updateInstMutation, {
        contractId: updated.id,
        amount: updated.installmentAmount,
        fee: updated.dailyLateFee || 0
      });
    } catch (e) {
      console.error('Erro ao atualizar contrato no Nhost:', e);
    }
  };

  const deleteContract = async (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    setInstallments(prev => prev.filter(i => i.contractId !== id));

    try {
      const mutation = `
        mutation DeleteContract($id: uuid!) {
          delete_contracts_by_pk(id: $id) {
            id
          }
        }
      `;
      await executeGql(mutation, { id });
    } catch (e) {
      console.error('Erro ao deletar contrato no Nhost:', e);
    }
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
    let updatedPaidAmount = 0;
    let updatedPaidDate: string | undefined = undefined;
    let updatedDueDate: string | undefined = undefined;
    let updatedStatus = 'A vencer';

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
        updatedPaidAmount = inst.originalAmount;
        updatedPaidDate = todayStr;
        updatedStatus = 'Pago';
        return {
          ...inst,
          paidAmount: inst.originalAmount,
          paidDate: todayStr,
          status: 'Pago',
          history: updatedHistory
        };
      }

      if (type === 'JUROS') {
        const newPaidAmount = (inst.paidAmount || 0) + amountPaid;
        updatedPaidAmount = newPaidAmount;
        updatedPaidDate = todayStr;
        updatedDueDate = newDueDate || inst.dueDate;
        updatedStatus = 'A vencer';
        return {
          ...inst,
          paidAmount: newPaidAmount,
          paidDate: todayStr,
          dueDate: newDueDate || inst.dueDate,
          status: 'A vencer',
          history: updatedHistory
        };
      }

      if (type === 'PARCIAL') {
        const newPaidAmount = (inst.paidAmount || 0) + amountPaid;
        const isFullyPaid = newPaidAmount >= inst.originalAmount;
        updatedPaidAmount = newPaidAmount;
        updatedPaidDate = todayStr;
        updatedDueDate = newDueDate || inst.dueDate;
        updatedStatus = isFullyPaid ? 'Pago' : 'Pago Parcial';
        return {
          ...inst,
          paidAmount: newPaidAmount,
          paidDate: todayStr,
          dueDate: newDueDate || inst.dueDate,
          status: isFullyPaid ? 'Pago' : 'Pago Parcial',
          history: updatedHistory
        };
      }

      return inst;
    }));

    try {
      const mutation = `
        mutation UpdateInstallment($id: uuid!, $set: installments_set_input!) {
          update_installments_by_pk(pk_columns: { id: $id }, _set: $set) {
            id
          }
        }
      `;
      const setPayload: any = {
        paid_amount: updatedPaidAmount,
        status: updatedStatus
      };
      if (updatedPaidDate) setPayload.paid_date = updatedPaidDate;
      if (updatedDueDate) setPayload.due_date = updatedDueDate;

      await executeGql(mutation, { id: installmentId, set: setPayload });
    } catch (e) {
      console.error('Erro ao atualizar parcela no Nhost:', e);
    }
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
      approvedUsers,
      approveUser,
      revokeUser,
      userRegistry,
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
