import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import rateLimit from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    
    try {
      await limiter.check(5, ip) // 5 requests per minute per IP
    } catch {
      return NextResponse.json(
        { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    const { code, cpf, password, email } = await request.json()

    if (!code || !cpf || !password) {
      return NextResponse.json(
        { message: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Basic Input Validation
    if (password.length < 6) {
       return NextResponse.json({ message: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }
    if (cpf.length < 11) {
        return NextResponse.json({ message: 'CPF inválido' }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Verificar se o código existe e está inativo
    const debugLogs: any[] = []
    const log = (msg: string, data?: any) => {
      console.log(msg, data)
      debugLogs.push({ msg, data })
    }

    log('--- Activation Attempt ---')
    log('Input:', { code, cpf })

    let { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, code, status')
      .eq('code', code)
      .maybeSingle()

    log('Affiliate search result:', { affiliate, error: affiliateError })

    // Se o afiliado não existir, verificamos se existe uma venda válida para criar o registro (Lazy Creation)
    if (!affiliate) {
      log('Affiliate not found, attempting lazy creation...')
      // Buscando venda sem filtro de status primeiro para debug
      const { data: saleCheck } = await supabase
        .from('vendas_amostra')
        .select('id, payment_link_status, codigo_gerado, codigo_usado')
        .eq('codigo_gerado', code)
        .maybeSingle()
      
      log('Sale check result:', saleCheck)

      // Verificação manual do status para garantir
      if (saleCheck && saleCheck.payment_link_status === true) {
        log('Valid sale found, creating affiliate record...')
        const { data: newAffiliate, error: createError } = await supabase
          .from('affiliates')
          .insert({
            code: code,
            status: 'inactive',
            venda_id: saleCheck.id
          })
          .select('id, code, status')
          .single()
        
        log('Affiliate creation result:', { newAffiliate, error: createError })

        if (!createError && newAffiliate) {
          affiliate = newAffiliate
        }
      } else {
        log('Sale invalid or not found. Status:', saleCheck?.payment_link_status)
      }
    }

    if (!affiliate || affiliate.status !== 'inactive') {
      log('Validation failed: Affiliate missing or not inactive.', { affiliate })
      return NextResponse.json(
        { message: 'Código ou CPF inválidos.', debug: debugLogs },
        { status: 400 }
      )
    }

    // Verificar propriedade do código (CPF deve ter comprado com esse código)
    const cpfDigits = cpf.replace(/\D/g, '')
    log('Verifying ownership for CPF:', cpfDigits)

    const { data: sale, error: saleError } = await supabase
      .from('vendas_amostra')
      .select('id, cpf, email, codigo_gerado, codigo_usado, nome_completo')
      .eq('codigo_gerado', code)
      .limit(1)
      .maybeSingle()
    
    log('Sale ownership check:', { sale, error: saleError })

    if (saleError || !sale) {
       log('Erro ao buscar venda (ownership check):', saleError)
       return NextResponse.json(
        { message: 'Código ou CPF inválidos.', debug: debugLogs },
        { status: 400 }
      )
    }

    const dbCpfDigits = String(sale.cpf || '').replace(/\D/g, '')
    log('CPF comparison:', { db: dbCpfDigits, input: cpfDigits })

    if (dbCpfDigits !== cpfDigits) {
      log('CPF mismatch')
      return NextResponse.json(
        { message: 'Código ou CPF inválidos.', debug: debugLogs },
        { status: 400 }
      )
    }

    // Buscar email do cliente se não foi fornecido
    let finalEmail = email
    if (!finalEmail) {
      if (sale?.email) {
        finalEmail = sale.email
      } else {
        log('Email not found in sale and not provided')
        return NextResponse.json(
          { message: 'Email não encontrado para este CPF e código', debug: debugLogs },
          { status: 400 }
        )
      }
    }

    // Criar usuário no Supabase Auth
    const fullName = sale.nome_completo || '';
    log('Creating Auth user:', { email: finalEmail, fullName, cpf: cpfDigits })
    
    let userId: string | undefined

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: finalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        affiliate_code: code,
        cpf: cpf.replace(/\D/g, ''),
        full_name: fullName,
        name: fullName
      }
    })

    log('Auth creation result:', authData)
    log('Auth creation error:', authError)

    if (authData.user) {
      userId = authData.user.id
    } else if (authError) {
      const msg = String(authError.message || '').toLowerCase()
      const alreadyExists = msg.includes('already') || msg.includes('registered') || msg.includes('exists')
      
      if (alreadyExists) {
        log('User already exists. Attempting to retrieve ID via listUsers...')
        // Tentar recuperar o ID via listUsers (admin)
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listData?.users) {
          const existingUser = listData.users.find(u => u.email === finalEmail)
          if (existingUser) {
            userId = existingUser.id
            log('Found existing Auth User ID:', userId)
            
            // Opcional: Atualizar metadata do usuário existente para o novo código?
            // Se ele está ativando um NOVO código, talvez devêssemos atualizar.
            const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
              user_metadata: {
                ...existingUser.user_metadata,
                affiliate_code: code, // Atualiza para o novo código
                cpf: cpf.replace(/\D/g, ''),
                full_name: fullName,
                name: fullName
              }
            })
            if (updateAuthError) log('Error updating existing user metadata:', updateAuthError)
            else log('Updated existing user metadata with new code')
            
          } else {
            log('User not found in first page of listUsers. Trying public.users fallback...')
          }
        } else {
          log('Error listing users:', listError)
        }
      } else {
        log('Critical error creating auth user:', authError)
        return NextResponse.json(
          { message: 'Erro ao criar conta. Tente novamente.', debug: debugLogs },
          { status: 500 }
        )
      }
    }

    // Fallback: Tentar recuperar da tabela users se ainda não tivermos o ID
    if (!userId) {
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', finalEmail).maybeSingle()
        if (existingUser) {
            userId = existingUser.id
            log('Found existing user ID in public.users:', userId)
        } else {
            log('User ID could not be retrieved. Skipping public.users upsert.')
        }
    }

    // Criar registro na tabela users para vincular CPF ao email
    if (userId) {
      log('Upserting public.users for ID:', userId)
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: finalEmail,
          cpf: cpf.replace(/\D/g, ''),
          affiliate_code: code,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      log('User table upsert result:', userError)

      if (userError) {
        log('Erro ao criar registro de usuário:', userError)
        // Não retornamos erro aqui pois o usuário do auth já foi criado/existe
      }
    } else {
        log('Skipping public.users upsert because UserID is missing (likely already exists in Auth but not in public DB)')
    }

    // Ativar o afiliado
    log('Activating affiliate status for ID:', affiliate.id)
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({ status: 'active' })
      .eq('id', affiliate.id)

    if (updateError) {
      log('Erro ao ativar afiliado:', updateError)
      return NextResponse.json(
        { message: 'Erro ao ativar conta', debug: debugLogs },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, email: finalEmail, userId: userId, debug: debugLogs })
  } catch (error) {
    console.error('Erro ao ativar afiliado:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}