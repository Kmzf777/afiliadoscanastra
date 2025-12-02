import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('API Ranking: Starting request...')
  
  try {
    const supabase = getSupabaseServer()
    if (!supabase) {
        throw new Error("Supabase client could not be initialized")
    }

    console.log('API Ranking: Fetching sales...')
    // 1. Fetch all successful sales
    const { data: sales, error: salesError } = await supabase
      .from('vendas_amostra')
      .select('codigo_usado, payment_link_status')
      .eq('payment_link_status', true)
      .not('codigo_usado', 'is', null)

    if (salesError) {
      console.error('API Ranking: Error fetching sales:', JSON.stringify(salesError, null, 2))
      throw salesError
    }
    
    if (!sales || sales.length === 0) {
        console.log('API Ranking: No confirmed sales data returned.')
        // Debug check: Total sales count
        try {
            const { count } = await supabase.from('vendas_amostra').select('*', { count: 'exact', head: true })
            console.log(`API Ranking: Total sales in DB (any status): ${count}`)
        } catch (e) {
            console.error('API Ranking: Error counting sales:', e)
        }
        return NextResponse.json([])
    }

    console.log(`API Ranking: Fetched ${sales.length} confirmed sales.`)

    // 2. Group by codigo_usado and count
    const salesCount: Record<string, number> = {}
    
    for (const sale of sales) {
        const code = sale.codigo_usado
        if (code) {
            // Ensure code is treated as string key and trimmed
            const codeKey = String(code).trim()
            salesCount[codeKey] = (salesCount[codeKey] || 0) + 1
        }
    }

    const uniqueCodes = Object.keys(salesCount)
    console.log(`API Ranking: Found ${uniqueCodes.length} unique codes.`)
    
    if (uniqueCodes.length === 0) {
      return NextResponse.json([])
    }

    // 3. Find owners for these codes
    console.log('API Ranking: Fetching owners...')
    const codeToOwner: Record<string, { cpf: string, name: string }> = {}
    
    // Strategy A: Direct lookup in vendas_amostra (where codigo_gerado matches)
    const BATCH_SIZE = 50; 
    
    for (let i = 0; i < uniqueCodes.length; i += BATCH_SIZE) {
        const batch = uniqueCodes.slice(i, i + BATCH_SIZE);
        const { data: batchOwners, error: batchError } = await supabase
            .from('vendas_amostra')
            .select('codigo_gerado, cpf, nome_completo')
            .in('codigo_gerado', batch);

        if (batchError) {
            console.error('API Ranking: Error fetching owners batch:', JSON.stringify(batchError, null, 2));
            continue;
        }
        
        if (batchOwners) {
            for (const owner of batchOwners) {
                if (owner.codigo_gerado && owner.nome_completo) {
                    codeToOwner[String(owner.codigo_gerado)] = {
                        cpf: owner.cpf,
                        name: owner.nome_completo
                    }
                }
            }
        }
    }

    // Strategy B: Fallback to users table -> vendas_amostra (for name)
    const missingCodes = uniqueCodes.filter(c => !codeToOwner[c]);
    if (missingCodes.length > 0) {
        console.log(`API Ranking: ${missingCodes.length} codes missing owner info. Trying secondary lookup...`)
        
        for (let i = 0; i < missingCodes.length; i += BATCH_SIZE) {
             const batch = missingCodes.slice(i, i + BATCH_SIZE)
             
             // Find user by affiliate_code
             const { data: userOwners } = await supabase
                .from('users')
                .select('affiliate_code, cpf, email')
                .in('affiliate_code', batch)
             
             if (userOwners && userOwners.length > 0) {
                 const cpfsToLookup: string[] = []
                 const cpfToCode: Record<string, string> = {}
                 
                 for (const u of userOwners) {
                     if (u.cpf) {
                         cpfsToLookup.push(u.cpf)
                         cpfToCode[u.cpf] = String(u.affiliate_code)
                     } else if (u.email) {
                         // If no CPF but email, use email name as fallback immediately
                         const code = String(u.affiliate_code)
                         if (!codeToOwner[code]) {
                             codeToOwner[code] = {
                                 cpf: '',
                                 name: u.email.split('@')[0]
                             }
                         }
                     }
                 }
                 
                 if (cpfsToLookup.length > 0) {
                     // Find name from any sale with this CPF
                     const { data: names } = await supabase
                        .from('vendas_amostra')
                        .select('cpf, nome_completo')
                        .in('cpf', cpfsToLookup)
                        .not('nome_completo', 'is', null)
                     
                     if (names) {
                         for (const n of names) {
                             const code = cpfToCode[n.cpf]
                             if (code && !codeToOwner[code]) {
                                 codeToOwner[code] = {
                                     cpf: n.cpf,
                                     name: n.nome_completo
                                 }
                             }
                         }
                     }
                 }
             }
        }
    }

    console.log(`API Ranking: Fetched owner info for ${Object.keys(codeToOwner).length} codes.`)

    // 4. Construct final ranking data
    const ranking = uniqueCodes.map((code) => {
      const count = salesCount[code]
      const ownerData = codeToOwner[code]
      
      return {
        id: code,
        name: ownerData?.name || `Afiliado ${code.substring(0, 4)}...`,
        sales: count,
        revenue: count * 5.00,
        avatar: ''
      }
    })

    // Sort by sales desc
    ranking.sort((a, b) => b.sales - a.sales)
    
    // Limit to Top 100
    const limitedRanking = ranking.slice(0, 100);

    return NextResponse.json(limitedRanking)
  } catch (error: any) {
    console.error('API Ranking: Critical error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}
