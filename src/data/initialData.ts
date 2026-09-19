import type { Customer, Contract, Installment } from '../types';

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Neymar Junior',
    email: 'neymar.jr@exemplo.com',
    phone: '(11) 98765-4321',
    birthDate: '1992-02-05',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    cep: '01310-100',
    address: 'Av. Paulista',
    number: '1000',
    complement: 'Apto 151',
    createdAt: '2024-09-01'
  },
  {
    id: 'cust-2',
    name: 'Patricia Pereira',
    email: 'patricia.pereira@exemplo.com',
    phone: '(56) 16516-5161',
    birthDate: '1988-06-15',
    cpf: '987.654.321-11',
    rg: '98.765.432-1',
    cep: '70000-000',
    address: 'Rua das Flores',
    number: '450',
    complement: 'Bloco B',
    createdAt: '2024-09-10'
  },
  {
    id: 'cust-3',
    name: 'Marcos Paulo',
    email: 'marcos.paulo@exemplo.com',
    phone: '(21) 99123-8899',
    birthDate: '1995-11-20',
    cpf: '456.789.123-33',
    rg: '45.678.912-3',
    cep: '22000-000',
    address: 'Rua Barata Ribeiro',
    number: '88',
    createdAt: '2024-09-12'
  }
];

export const initialContracts: Contract[] = [
  {
    id: 'cnt-1',
    contractNumber: '1',
    customerId: 'cust-1',
    customerName: 'Neymar Junior',
    startDate: '2024-10-12',
    amount: 6000.00,
    interestRate: 30,
    periodDays: 15,
    totalInstallments: 120,
    installmentAmount: 65.00,
    totalToReceive: 7800.00,
    dailyLateFee: 5.00,
    notes: 'Informações adicionais do empréstimo de Neymar',
    status: 'Ativo',
    createdAt: '2024-10-01'
  },
  {
    id: 'cnt-2',
    contractNumber: '2',
    customerId: 'cust-2',
    customerName: 'Patricia Pereira',
    startDate: '2024-10-15',
    amount: 3000.00,
    interestRate: 20,
    periodDays: 30,
    totalInstallments: 10,
    installmentAmount: 360.00,
    totalToReceive: 3600.00,
    dailyLateFee: 10.00,
    notes: 'Pagamento mensal pré-acordado',
    status: 'Ativo',
    createdAt: '2024-10-15'
  }
];

export const initialInstallments: Installment[] = [
  {
    id: 'inst-1',
    contractId: 'cnt-1',
    installmentNumber: 1,
    totalInstallments: 120,
    dueDate: '2024-10-12',
    originalAmount: 65.00,
    dailyLateFee: 5.00,
    paidAmount: 0,
    status: 'Atrasado'
  },
  {
    id: 'inst-2',
    contractId: 'cnt-1',
    installmentNumber: 2,
    totalInstallments: 120,
    dueDate: '2024-10-11',
    originalAmount: 65.00,
    dailyLateFee: 5.00,
    paidAmount: 0,
    status: 'Atrasado'
  },
  {
    id: 'inst-3',
    contractId: 'cnt-1',
    installmentNumber: 3,
    totalInstallments: 120,
    dueDate: '2024-10-09',
    originalAmount: 65.00,
    dailyLateFee: 5.00,
    paidAmount: 0,
    status: 'Atrasado'
  },
  {
    id: 'inst-4',
    contractId: 'cnt-1',
    installmentNumber: 4,
    totalInstallments: 120,
    dueDate: '2024-12-11',
    originalAmount: 65.00,
    dailyLateFee: 5.00,
    paidAmount: 0,
    status: 'A vencer'
  },
  {
    id: 'inst-5',
    contractId: 'cnt-1',
    installmentNumber: 5,
    totalInstallments: 120,
    dueDate: '2024-12-26',
    originalAmount: 65.00,
    dailyLateFee: 5.00,
    paidAmount: 0,
    status: 'A vencer'
  },
  {
    id: 'inst-6',
    contractId: 'cnt-2',
    installmentNumber: 1,
    totalInstallments: 10,
    dueDate: '2024-11-15',
    originalAmount: 360.00,
    dailyLateFee: 10.00,
    paidAmount: 360.00,
    paidDate: '2024-11-14',
    status: 'Pago'
  },
  {
    id: 'inst-7',
    contractId: 'cnt-2',
    installmentNumber: 2,
    totalInstallments: 10,
    dueDate: new Date().toISOString().split('T')[0],
    originalAmount: 360.00,
    dailyLateFee: 10.00,
    paidAmount: 0,
    status: 'Vencendo Hoje'
  }
];
