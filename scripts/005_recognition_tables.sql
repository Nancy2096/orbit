-- =============================================
-- SISTEMA DE GESTION MULTIAGENCIA
-- Script 005: Recognition (Reconocimientos) Tables
-- =============================================

-- Tabla de configuración de reconocimientos por agencia
CREATE TABLE IF NOT EXISTS public.recognition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  max_recognitions_per_month INTEGER DEFAULT 2,
  point_value DECIMAL(10,2) DEFAULT 10.00,
  min_redemption_points INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id)
);

-- Tabla de categorías de reconocimiento
CREATE TABLE IF NOT EXISTS public.recognition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 10,
  color VARCHAR(20) DEFAULT '#3b82f6',
  icon VARCHAR(50) DEFAULT 'star',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de seguimiento de reconocimientos mensuales por empleado
CREATE TABLE IF NOT EXISTS public.recognition_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  recognitions_given INTEGER DEFAULT 0,
  points_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, staff_id, year, month)
);

-- Tabla de transacciones de reconocimientos
CREATE TABLE IF NOT EXISTS public.recognition_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  from_staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  to_staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.recognition_categories(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de balance acumulado de puntos
CREATE TABLE IF NOT EXISTS public.recognition_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  redeemed_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, staff_id)
);

-- Tabla de tarjetas de regalo / recompensas disponibles
CREATE TABLE IF NOT EXISTS public.recognition_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  monetary_value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de canjes de puntos
CREATE TABLE IF NOT EXISTS public.recognition_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  gift_card_id UUID REFERENCES public.recognition_gift_cards(id) ON DELETE SET NULL,
  points_redeemed INTEGER NOT NULL,
  monetary_value DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_recognition_settings_agency ON public.recognition_settings(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_categories_agency ON public.recognition_categories(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_allocations_agency ON public.recognition_allocations(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_allocations_staff ON public.recognition_allocations(staff_id);
CREATE INDEX IF NOT EXISTS idx_recognition_allocations_period ON public.recognition_allocations(year, month);
CREATE INDEX IF NOT EXISTS idx_recognition_transactions_agency ON public.recognition_transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_transactions_from ON public.recognition_transactions(from_staff_id);
CREATE INDEX IF NOT EXISTS idx_recognition_transactions_to ON public.recognition_transactions(to_staff_id);
CREATE INDEX IF NOT EXISTS idx_recognition_transactions_period ON public.recognition_transactions(year, month);
CREATE INDEX IF NOT EXISTS idx_recognition_balances_agency ON public.recognition_balances(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_balances_staff ON public.recognition_balances(staff_id);
CREATE INDEX IF NOT EXISTS idx_recognition_gift_cards_agency ON public.recognition_gift_cards(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_redemptions_agency ON public.recognition_redemptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_recognition_redemptions_staff ON public.recognition_redemptions(staff_id);
CREATE INDEX IF NOT EXISTS idx_recognition_redemptions_status ON public.recognition_redemptions(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.recognition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies para recognition_settings
CREATE POLICY "Users can view recognition settings of their agencies" ON public.recognition_settings
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "Admins can manage recognition settings" ON public.recognition_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    OR (
      agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.id = auth.uid() AND r.level >= 80
      )
    )
  );

-- Policies para recognition_categories
CREATE POLICY "Users can view recognition categories of their agencies" ON public.recognition_categories
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "Admins can manage recognition categories" ON public.recognition_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    OR (
      agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.id = auth.uid() AND r.level >= 80
      )
    )
  );

-- Policies para recognition_allocations
CREATE POLICY "Users can view recognition allocations of their agencies" ON public.recognition_allocations
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "System can manage recognition allocations" ON public.recognition_allocations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    OR (
      agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    )
  );

-- Policies para recognition_transactions
CREATE POLICY "Users can view recognition transactions of their agencies" ON public.recognition_transactions
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "Users can create recognition transactions in their agencies" ON public.recognition_transactions
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
  );

-- Policies para recognition_balances
CREATE POLICY "Users can view recognition balances of their agencies" ON public.recognition_balances
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "System can manage recognition balances" ON public.recognition_balances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    OR (
      agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    )
  );

-- Policies para recognition_gift_cards
CREATE POLICY "Users can view gift cards of their agencies" ON public.recognition_gift_cards
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "Admins can manage gift cards" ON public.recognition_gift_cards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    OR (
      agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.id = auth.uid() AND r.level >= 80
      )
    )
  );

-- Policies para recognition_redemptions
CREATE POLICY "Users can view redemptions of their agencies" ON public.recognition_redemptions
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
  );

CREATE POLICY "Users can create redemptions in their agencies" ON public.recognition_redemptions
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage redemptions" ON public.recognition_redemptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_superadmin = true)
    OR (
      agency_id IN (SELECT agency_id FROM public.user_agencies WHERE user_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.users u 
        JOIN public.roles r ON u.role_id = r.id 
        WHERE u.id = auth.uid() AND r.level >= 80
      )
    )
  );
