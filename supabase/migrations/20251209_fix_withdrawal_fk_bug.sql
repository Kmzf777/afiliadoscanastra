-- Fix permission to access auth schema for the function
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount DECIMAL, p_pix_key TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_user_id UUID;
  v_balance_data json;
  v_available DECIMAL;
  v_new_withdrawal_id UUID;
  v_email TEXT;
  v_cpf TEXT;
  v_affiliate_code TEXT;
  v_code_valid BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SYNC LOGIC: Ensure user exists in public.users
  -- First, check if we have the data we need from auth
  SELECT email, raw_user_meta_data->>'cpf', raw_user_meta_data->>'affiliate_code'
  INTO v_email, v_cpf, v_affiliate_code
  FROM auth.users
  WHERE id = v_user_id;

  -- Check for CPF conflict
  IF v_cpf IS NOT NULL THEN
      SELECT id INTO v_old_user_id FROM public.users WHERE cpf = v_cpf;
      
      IF v_old_user_id IS NOT NULL AND v_old_user_id <> v_user_id THEN
          -- Conflict detected: CPF exists for another user
          
          -- Check if the old user has any withdrawals
          IF EXISTS (SELECT 1 FROM public.withdrawals WHERE user_id = v_old_user_id) THEN
              RAISE EXCEPTION 'CPF já está em uso por outra conta com histórico de saques. Por favor, entre em contato com o suporte.';
          ELSE
              -- Safe to clean up: The old user has no withdrawals.
              -- We assume it's a stale record.
              DELETE FROM public.users WHERE id = v_old_user_id;
          END IF;
      END IF;
  END IF;

  -- Check if affiliate code exists in affiliates table
  v_code_valid := false;
  IF v_affiliate_code IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM public.affiliates WHERE code = v_affiliate_code) THEN
          v_code_valid := true;
      ELSE
          -- Code from metadata is invalid (not in affiliates table).
          -- We will ignore it to avoid FK violation.
          v_affiliate_code := NULL;
      END IF;
  END IF;

  -- Now insert or ignore (since we cleaned up conflicts)
  IF v_code_valid THEN
      -- Valid code from metadata: Sync everything
      INSERT INTO public.users (id, email, cpf, affiliate_code)
      VALUES (v_user_id, v_email, v_cpf, v_affiliate_code)
      ON CONFLICT (id) DO UPDATE 
      SET 
        email = EXCLUDED.email,
        cpf = EXCLUDED.cpf,
        affiliate_code = EXCLUDED.affiliate_code;
  ELSE
      -- Invalid or missing code from metadata:
      -- Insert with NULL if new, but if exists, PRESERVE existing affiliate_code
      INSERT INTO public.users (id, email, cpf, affiliate_code)
      VALUES (v_user_id, v_email, v_cpf, NULL)
      ON CONFLICT (id) DO UPDATE 
      SET 
        email = EXCLUDED.email,
        cpf = EXCLUDED.cpf;
        -- INTENTIONALLY OMITTING affiliate_code update to preserve existing value
  END IF;

  -- Check minimum amount (e.g., R$ 50.00)
  IF p_amount < 50.00 THEN
    RAISE EXCEPTION 'O valor mínimo para saque é R$ 50,00';
  END IF;

  -- Get current balance using the helper function
  v_balance_data := public.get_affiliate_balance(v_user_id);
  v_available := (v_balance_data->>'available_balance')::DECIMAL;

  -- Check if funds are sufficient
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: R$ %', v_available;
  END IF;

  -- Execute the "Deduction" (Insert the withdrawal record)
  INSERT INTO public.withdrawals (user_id, amount, pix_key, status)
  VALUES (v_user_id, p_amount, p_pix_key, 'pending')
  RETURNING id INTO v_new_withdrawal_id;

  RETURN json_build_object(
    'success', true,
    'withdrawal_id', v_new_withdrawal_id,
    'new_balance', v_available - p_amount
  );
END;
$$;
