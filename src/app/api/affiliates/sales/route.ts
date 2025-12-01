import { NextResponse } from 'next/server'
import { getSupabaseSSR, getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseSSR()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get affiliate code for the user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('affiliate_code')
      .eq('id', user.id)
      .single()

    let affiliateCode = userData?.affiliate_code

    if (userError || !affiliateCode) {
        // Fallback to metadata if not in users table (though it should be)
        const code = user.user_metadata?.affiliate_code
        if (!code) {
            return NextResponse.json({ sales: [], affiliateCode: null })
        }
        // If found in metadata but not users table, use it
        affiliateCode = code
    }

    const affiliateCodeStr = String(affiliateCode)

    // Bypass RLS reliably using service role, while still authorizing the caller
    const admin = getSupabaseServer()

    const { data: confirmed, error: confirmedError } = await admin
      .from('vendas_amostra')
      .select('id, created_at, codigo_usado, payment_link_status, nome_completo, email')
      .eq('codigo_usado', affiliateCodeStr)
      .eq('payment_link_status', true)
      .order('created_at', { ascending: false })

    const { data: withLink, error: withLinkError } = await admin
      .from('vendas_amostra')
      .select('id, created_at, codigo_usado, payment_link_status, nome_completo, email')
      .eq('codigo_usado', affiliateCodeStr)
      .not('payment_link_id', 'is', null)
      .order('created_at', { ascending: false })
      

    if (confirmedError) {
      console.error('Error fetching confirmed sales:', confirmedError)
      throw confirmedError
    }
    if (withLinkError) {
      console.error('Error fetching link sales:', withLinkError)
      throw withLinkError
    }

    const mergedMap: Record<string, any> = {}
    ;[...(confirmed || []), ...(withLink || [])].forEach((s) => { mergedMap[String(s.id)] = s })
    const merged = Object.values(mergedMap).map((s: any) => ({
      ...s,
      nome: s.nome_completo
    }))

    const sorted = Array.isArray(merged) ? [...merged].sort((a: any, b: any) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0
      const db = b.created_at ? new Date(b.created_at).getTime() : 0
      return db - da
    }) : []

    return NextResponse.json({ 
        sales: sorted, 
        affiliateCode: affiliateCodeStr
    })

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
