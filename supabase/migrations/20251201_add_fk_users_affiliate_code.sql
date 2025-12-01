ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

DO $$ BEGIN
  ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_code_unique UNIQUE (code);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_affiliate_code_fkey
    FOREIGN KEY (affiliate_code) REFERENCES public.affiliates(code)
    ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON public.users(affiliate_code);
