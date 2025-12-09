-- Update the balance calculation function to be smarter about finding the affiliate code
CREATE OR REPLACE FUNCTION public.get_affiliate_balance(p_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_affiliate_code TEXT;
    v_total_earnings DECIMAL(10, 2) := 0;
    v_total_withdrawn DECIMAL(10, 2) := 0;
    v_sales_count INT := 0;
    v_cpf TEXT;
BEGIN
    -- 1. Try to get code from public.users
    SELECT affiliate_code, cpf INTO v_affiliate_code, v_cpf
    FROM public.users
    WHERE id = p_user_id;

    -- 2. If not found, try to get from auth.users metadata
    IF v_affiliate_code IS NULL THEN
        SELECT raw_user_meta_data->>'affiliate_code'
        INTO v_affiliate_code
        FROM auth.users
        WHERE id = p_user_id;
    END IF;

    -- 3. If still not found, return 0 (We don't do the complex CPF search in SQL for safety/perf, 
    -- ideally the user should have their code synced to public.users)
    IF v_affiliate_code IS NULL THEN
        RETURN json_build_object(
            'available_balance', 0,
            'total_earnings', 0,
            'total_withdrawn', 0,
            'sales_count', 0
        );
    END IF;

    -- Calculate Earnings (Credits): Count sales * 5.00
    SELECT count(*), COALESCE(count(*) * 5.00, 0)
    INTO v_sales_count, v_total_earnings
    FROM public.vendas_amostra
    WHERE codigo_usado = v_affiliate_code
    AND payment_link_status = true;

    -- Calculate Withdrawals (Debits): Sum of pending/paid
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_withdrawn
    FROM public.withdrawals
    WHERE user_id = p_user_id
    AND status IN ('pending', 'paid');

    -- Return the result
    RETURN json_build_object(
        'available_balance', v_total_earnings - v_total_withdrawn,
        'total_earnings', v_total_earnings,
        'total_withdrawn', v_total_withdrawn,
        'sales_count', v_sales_count
    );
END;
$$;
