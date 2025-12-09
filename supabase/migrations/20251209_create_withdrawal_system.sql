-- 1. Create Withdrawals table (The "Debit" side of the ledger)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
    pix_key TEXT NOT NULL,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- IMPORTANT: We do NOT grant INSERT permissions to authenticated users on this table directly
-- to force them to use the secure function below.
GRANT SELECT ON public.withdrawals TO authenticated;


-- 2. Secure Function to Calculate Balance (The "Logic")
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
BEGIN
    -- Get the user's affiliate code
    SELECT affiliate_code INTO v_affiliate_code
    FROM public.users
    WHERE id = p_user_id;

    IF v_affiliate_code IS NULL THEN
        RETURN json_build_object(
            'available_balance', 0,
            'total_earnings', 0,
            'total_withdrawn', 0,
            'sales_count', 0
        );
    END IF;

    -- Calculate Earnings (Credits): Count sales * 5.00
    -- Note: Ensure payment_link_status is correctly typed as boolean or check appropriately
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


-- 3. Secure Function to Request Withdrawal (The "Transaction")
-- This function "locks" the logic: it checks balance and deducts (inserts) in one go.
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount DECIMAL, p_pix_key TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_balance_data json;
    v_available DECIMAL;
    v_new_withdrawal_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check minimum amount (e.g., R$ 10.00)
    IF p_amount < 10.00 THEN
        RAISE EXCEPTION 'O valor mínimo para saque é R$ 10,00';
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

-- Grant permissions to call these functions
GRANT EXECUTE ON FUNCTION public.get_affiliate_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(DECIMAL, TEXT) TO authenticated;
