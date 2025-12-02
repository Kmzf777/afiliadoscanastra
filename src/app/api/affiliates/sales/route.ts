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
    if (!affiliateCode) {
        const cpf = userData?.cpf || user.user_metadata?.cpf
        if (cpf) {
             const cleanCpf = String(cpf).replace(/\D/g, '')
             // Try exact match first
             const { data: saleData } = await supabaseAdmin
                .from('vendas_amostra')
                .select('codigo_gerado')
                .eq('cpf', cleanCpf)
                .limit(1)
                .maybeSingle()
             
             if (saleData?.codigo_gerado) {
                 affiliateCode = saleData.codigo_gerado
             } else {
                 // Try formatted CPF match
                 const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                 const { data: saleDataFormatted } = await supabaseAdmin
                    .from('vendas_amostra')
                    .select('codigo_gerado')
                    .eq('cpf', formattedCpf)
                    .limit(1)
                    .maybeSingle()

                 if (saleDataFormatted?.codigo_gerado) {
                     affiliateCode = saleDataFormatted.codigo_gerado
                 }
             }
        }
    }

    if (!affiliateCode) {
      return NextResponse.json({ sales: [], affiliateCode: null })
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
      affiliateCode
    })

  } catch (error: any) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
