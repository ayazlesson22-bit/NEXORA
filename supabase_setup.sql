-- ========================================================
-- NEXORA TECH E-COMMERCE - SUPABASE DATABASE SCHEMA
-- (ALL PRODUCTS REMOVED - EMPTY CLEAN CATALOG READY FOR ADMIN)
-- ========================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mlhgxsdjigumwwiukxnu/sql

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Products Table (Empty)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_pkr NUMERIC(12, 2) NOT NULL,
    original_price_usd NUMERIC(10, 2),
    original_price_pkr NUMERIC(12, 2),
    rating NUMERIC(2, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INT DEFAULT 25,
    is_featured BOOLEAN DEFAULT false,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    specs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
    currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference TEXT,
    order_status VARCHAR(50) DEFAULT 'Pending',
    items_summary JSONB NOT NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Products Security Policies
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Products" ON public.products;
CREATE POLICY "Public Insert Products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Products" ON public.products;
CREATE POLICY "Public Update Products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public Delete Products" ON public.products;
CREATE POLICY "Public Delete Products" ON public.products FOR DELETE USING (true);

-- 6. Orders Security Policies
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Read Orders" ON public.orders;
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Update Orders" ON public.orders;
CREATE POLICY "Public Update Orders" ON public.orders FOR UPDATE USING (true);

-- Clean out any existing products
DELETE FROM public.products;
