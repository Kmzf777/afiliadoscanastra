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
    // We explicitly cast the result or use generic if possible, but without generated types we rely on inference
    const { data: sales, error: salesError } = await supabase
      .from('vendas_amostra')
      .select('codigo_usado')
      .eq('payment_link_status', true)
      .not('codigo_usado', 'is', null)

    if (salesError) {
      console.error('API Ranking: Error fetching sales:', JSON.stringify(salesError, null, 2))
      throw salesError
    }
    
    if (!sales) {
        console.log('API Ranking: No sales data returned.')
        return NextResponse.json([])
    }

    console.log(`API Ranking: Fetched ${sales.length} sales.`)

    // 2. Group by codigo_usado and count
    const salesCount: Record<string, number> = {}
    
    for (const sale of sales) {
        const code = sale.codigo_usado
        if (code) {
            // Ensure code is treated as string key
            const codeKey = String(code)
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
    
    const BATCH_SIZE = 50; 
    const owners: any[] = [];
    
    for (let i = 0; i < uniqueCodes.length; i += BATCH_SIZE) {
        const batch = uniqueCodes.slice(i, i + BATCH_SIZE);
        const { data: batchOwners, error: batchError } = await supabase
            .from('vendas_amostra')
            .select('codigo_gerado, cpf')
            .in('codigo_gerado', batch);

        if (batchError) {
            console.error('API Ranking: Error fetching owners batch:', JSON.stringify(batchError, null, 2));
            throw batchError;
        }
        
        if (batchOwners) {
            owners.push(...batchOwners);
        }
    }

    console.log(`API Ranking: Fetched ${owners.length} owners.`)

    // Map code -> cpf
    const codeToCpf: Record<string, string> = {}
    for (const owner of owners) {
        if (owner.codigo_gerado && owner.cpf) {
            codeToCpf[String(owner.codigo_gerado)] = owner.cpf
        }
    }

    const uniqueCpfs = Array.from(new Set(Object.values(codeToCpf)))
    console.log(`API Ranking: Found ${uniqueCpfs.length} unique CPFs.`)

    // 4. Fetch user details (name)
    let usersMap: Record<string, string> = {}
    if (uniqueCpfs.length > 0) {
      console.log('API Ranking: Fetching users...')
      
      for (let i = 0; i < uniqueCpfs.length; i += BATCH_SIZE) {
          const batchCpfs = uniqueCpfs.slice(i, i + BATCH_SIZE);
          const { data: batchUsers, error: usersError } = await supabase
            .from('users')
            .select('cpf, name')
            .in('cpf', batchCpfs);

          if (usersError) {
            console.error('API Ranking: Error fetching users batch:', JSON.stringify(usersError, null, 2));
            throw usersError;
          }
          
          if (batchUsers) {
             for (const user of batchUsers) {
                if (user.cpf) {
                    usersMap[user.cpf] = user.name
                }
             }
          }
      }
      console.log(`API Ranking: Fetched users map.`)
    }


    // 5. Construct final ranking data
    const ranking = uniqueCodes.map((code) => {
      const count = salesCount[code]
      const cpf = codeToCpf[code]
      const name = cpf ? usersMap[cpf] : null
      
      return {
        id: code,
        name: name || `Afiliado ${code.substring(0, 4)}...`,
        sales: count,
        revenue: count * 5.00,
        avatar: '', 
        cpf: cpf 
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
