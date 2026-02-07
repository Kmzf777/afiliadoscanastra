const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dlkfpjismifzzzyphqtn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsa2ZwamlzbWlmenp6eXBocXRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA0NzY5NiwiZXhwIjoyMDY2NjIzNjk2fQ.YtOamWgCRfct7FUq0DkqtV758G1bsIi1YmkabJjO2gA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const CODE = '399799';
const CPF = '111.710.776-02';
const CPF_CLEAN = CPF.replace(/\D/g, '');
const EMAIL = 'rafaelreisssilva034@gmail.com';

async function diagnose() {
    console.log('--- DIAGNOSIS START ---');

    // 1. Check Affiliate
    console.log('\n1. Checking Affiliate...');
    const { data: affiliate, error: affError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('code', CODE)
        .maybeSingle();
    
    if (affError) console.error('Error fetching affiliate:', affError);
    console.log('Affiliate found:', affiliate);

    // 2. Check Sale
    console.log('\n2. Checking Sale...');
    const { data: sale, error: saleError } = await supabase
        .from('vendas_amostra')
        .select('*')
        .or(`codigo_gerado.eq.${CODE},codigo_usado.eq.${CODE}`)
        .maybeSingle();

    if (saleError) console.error('Error fetching sale:', saleError);
    console.log('Sale found:', sale ? {
        id: sale.id,
        cpf: sale.cpf,
        email: sale.email,
        payment_link_status: sale.payment_link_status,
        nome_completo: sale.nome_completo
    } : 'None');

    // 3. Check Auth User
    console.log('\n3. Checking Auth User (by email)...');
    // Admin listUsers to find by email
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === EMAIL);
    
    if (authError) console.error('Error fetching auth users:', authError);
    console.log('Auth User found:', user ? { id: user.id, email: user.email, metadata: user.user_metadata } : 'None');

    // 4. Check Public User
    console.log('\n4. Checking Public User Table...');
    const { data: publicUser, error: pubError } = await supabase
        .from('users')
        .select('*')
        .eq('email', EMAIL)
        .maybeSingle();

    if (pubError) console.error('Error fetching public user:', pubError);
    console.log('Public User found:', publicUser);

    // 5. Logic Validation
    console.log('\n--- LOGIC VALIDATION ---');
    if (!affiliate) {
        console.log('Affiliate does NOT exist. Logic should try lazy creation.');
        if (sale && sale.payment_link_status === true) {
            console.log('Valid sale exists. Lazy creation SHOULD work.');
        } else {
            console.log('No valid sale found. Lazy creation would FAIL.');
        }
    } else {
        console.log(`Affiliate exists. Status: ${affiliate.status}`);
        if (affiliate.status !== 'inactive') {
            console.log('FAIL: Affiliate is not inactive.');
        }
    }

    if (sale) {
        const saleCpf = String(sale.cpf || '').replace(/\D/g, '');
        if (saleCpf !== CPF_CLEAN) {
            console.log(`FAIL: CPF Mismatch. Sale: ${saleCpf}, Input: ${CPF_CLEAN}`);
        } else {
            console.log('PASS: CPF matches.');
        }
    } else {
        console.log('FAIL: Sale not found for verification.');
    }

    console.log('--- DIAGNOSIS END ---');
}

diagnose();
