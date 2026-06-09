-- =============================================
-- SISTEMA DE GESTION MULTIAGENCIA
-- Script 003: User Trigger for Auto-create Profile
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
  v_is_superadmin BOOLEAN;
BEGIN
  -- Check if this is the first user (make them superadmin)
  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'superadmin';
    v_is_superadmin := true;
  ELSE
    -- Default role is staff_operativo
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'staff_operativo';
    v_is_superadmin := COALESCE((NEW.raw_user_meta_data->>'is_superadmin')::boolean, false);
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    role_id,
    is_superadmin,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_role_id,
    v_is_superadmin,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name);

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_login
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger for updating last login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();
