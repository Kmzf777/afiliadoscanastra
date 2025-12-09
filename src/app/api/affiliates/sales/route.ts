import { NextResponse } from 'next/server'
import { getSupabaseSSR, getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Authenticate
    const supabaseSSR = getSupabaseSSR()
    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get Affiliate Code
    const supabaseAdmin = getSupabaseServer()
    
    // Try getting directly from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('affiliate_code, cpf')
      .eq('id', user.id)
      .single()

    let affiliateCode = userData?.affiliate_code ? String(userData.affiliate_code).trim() : null

    // Fallback: Try metadata
    if (!affiliateCode && user.user_metadata?.affiliate_code) {
        affiliateCode = String(user.user_metadata.affiliate_code).trim()
    }

    // Fallback: Try to find code by CPF if stored in metadata or user table
    let userName: string | null = null; // Start with null to force DB lookup if possible

    // 2.1 Always try to find name by affiliateCode in vendas_amostra, as it is the source of truth
        if (affiliateCode) {
            const { data: saleByCode } = await supabaseAdmin
                .from('vendas_amostra')
                .select('nome, nome_completo')
                .ilike('codigo_gerado', affiliateCode)
                .limit(1)
                .maybeSingle()
            
            if (saleByCode) {
                // Prioritize name found in database linked to the code
                userName = saleByCode.nome_completo || saleByCode.nome || null
            }
        }

        // If still null, try metadata or fallback to email logic later
        if (!userName) {
             userName = user.user_metadata?.full_name || user.user_metadata?.name || null;
        }

    if (!affiliateCode || !userName) {
        const cpf = userData?.cpf || user.user_metadata?.cpf
        if (cpf) {
             const cleanCpf = String(cpf).replace(/\D/g, '')
             // Try exact match first
             const { data: saleData } = await supabaseAdmin
                .from('vendas_amostra')
                .select('codigo_gerado, nome, nome_completo')
                .eq('cpf', cleanCpf)
                .limit(1)
                .maybeSingle()
             
             if (saleData) {
                if (!affiliateCode && saleData.codigo_gerado) {
                    affiliateCode = saleData.codigo_gerado
                }
                if (!userName) {
                    userName = saleData.nome_completo || saleData.nome
                }
             } else {
                 // Try formatted CPF match
                 const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                 const { data: saleDataFormatted } = await supabaseAdmin
                    .from('vendas_amostra')
                    .select('codigo_gerado, nome, nome_completo')
                    .eq('cpf', formattedCpf)
                    .limit(1)
                    .maybeSingle()

                 if (saleDataFormatted) {
                    if (!affiliateCode && saleDataFormatted.codigo_gerado) {
                        affiliateCode = saleDataFormatted.codigo_gerado
                    }
                    if (!userName) {
                        userName = saleDataFormatted.nome_completo || saleDataFormatted.nome
                    }
                 }
             }
        }
    }

    if (!userName && user.email) {
        const emailName = user.email.split('@')[0];
        // Try to make it look like a name
        userName = emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    if (!affiliateCode) {
      return NextResponse.json({ sales: [], affiliateCode: null, userName })
    }

    // 3. Fetch Sales
    // "codigo_usado = significa de quem é o codigo"
    // "payment_link_status = true" (confirmed)
    
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('vendas_amostra')
      .select('*')
      .eq('codigo_usado', affiliateCode)
      .eq('payment_link_status', true)
      .order('created_at', { ascending: false })

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      throw salesError
    }

    // Map to frontend expected format
    const formattedSales = sales.map(sale => ({
        ...sale,
        nome: sale.nome_completo || sale.nome // Ensure name is available
    }))

    return NextResponse.json({
      sales: formattedSales,
      affiliateCode,
      userName
    })

  } catch (error: any) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
