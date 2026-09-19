export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  cpf: string;
  rg: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  notes?: string;
  createdAt: string;
}

export type InstallmentStatus = 'A vencer' | 'Vencendo Hoje' | 'Atrasado' | 'Pago' | 'Pago Parcial';

export interface Installment {
  id: string;
  contractId: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  originalAmount: number;
  dailyLateFee: number; // Juros diário configurado para o contrato
  paidAmount: number;
  paidDate?: string;
  status: InstallmentStatus;
  history?: {
    date: string;
    type: 'QUITAÇÃO_TOTAL' | 'PAGAMENTO_JUROS' | 'PAGAMENTO_PARCIAL';
    amountPaid: number;
    newDueDate?: string;
    note?: string;
  }[];
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  startDate: string;
  amount: number; // Valor emprestado
  interestRate: number; // % Ex: 30%
  periodDays: number; // ex: 15 dias, 30 dias
  totalInstallments: number;
  installmentAmount: number; // Valor da parcela
  totalToReceive: number; // Total a receber no contrato
  dailyLateFee: number; // Juros diário fixo ou % por dia de atraso
  notes?: string;
  status: 'Ativo' | 'Quitado' | 'Cancelado';
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}
