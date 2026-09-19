-- =========================================================
-- CREDMAIS - SCRIPT DE CRIAÇÃO DE BANCO DE DADOS NHOST (CORRIGIDO)
-- Execute este script no Hasura Raw SQL (Marque a opção "Track this")
-- =========================================================

-- Habilitar extensão pgcrypto para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE CLIENTES (customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    birth_date DATE,
    cpf TEXT,
    rg TEXT,
    cep TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CONTRATOS (contracts)
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    period_days INTEGER NOT NULL DEFAULT 15,
    total_installments INTEGER NOT NULL,
    installment_amount NUMERIC(12, 2) NOT NULL,
    total_to_receive NUMERIC(12, 2) NOT NULL,
    daily_late_fee NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE PARCELAS (installments)
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    due_date DATE NOT NULL,
    original_amount NUMERIC(12, 2) NOT NULL,
    daily_late_fee NUMERIC(10, 2) DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) DEFAULT 0.00,
    paid_date DATE,
    status TEXT NOT NULL DEFAULT 'A vencer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
