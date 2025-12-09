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
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('id, code, status')
      .eq('code', code)
      .eq('status', 'inactive')
      .single()

    if (affiliateError || !affiliate) {
      // Delay response slightly to mitigate timing attacks (optional but good practice)
      return NextResponse.json(
        { message: 'Código ou CPF inválidos.' },
        { status: 400 }
      )
    }

    // Verificar propriedade do código (CPF deve ter comprado com esse código)
    const cpfDigits = cpf.replace(/\D/g, '')
    const { data: sale, error: saleError } = await supabase
      .from('vendas_amostra')
      .select('id, cpf, email, codigo_gerado, codigo_usado, nome, nome_completo')
      .or(`codigo_gerado.eq.${code},codigo_usado.eq.${code}`)
      .limit(1)
      .maybeSingle()

    if (saleError || !sale) {
       return NextResponse.json(
        { message: 'Código ou CPF inválidos.' },
        { status: 400 }
      )
    }

    const dbCpfDigits = String(sale.cpf || '').replace(/\D/g, '')
    if (dbCpfDigits !== cpfDigits) {
      return NextResponse.json(
        { message: 'Código ou CPF inválidos.' },
        { status: 400 }
      )
    }

    // Buscar email do cliente se não foi fornecido
    let finalEmail = email
    if (!finalEmail) {
      if (sale?.email) {
        finalEmail = sale.email
      } else {
        return NextResponse.json(
          { message: 'Email não encontrado para este CPF e código' },
          { status: 400 }
        )
      }
    }

    // Criar usuário no Supabase Auth
    const fullName = sale.nome_completo || sale.nome || '';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: finalEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        affiliate_code: code,
        cpf: cpf.replace(/\D/g, ''),
        full_name: fullName,
        name: fullName // Store full name in name field as well to match Dashboard expectation
      }
    })

    console.log('Auth creation result:', authData)
    console.log('Auth creation error:', authError)

    // Prosseguir mesmo que o usuário já exista
    if (authError) {
      const msg = String(authError.message || '').toLowerCase()
      const alreadyExists = msg.includes('already') || msg.includes('registered') || msg.includes('exists')
      if (!alreadyExists) {
        console.error('Erro ao criar usuário:', authError)
        return NextResponse.json(
          { message: 'Erro ao criar conta. Tente novamente.' },
          { status: 500 }
        )
      }
    }

    // Criar registro na tabela users para vincular CPF ao email
    if (authData.user) {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: finalEmail,
          cpf: cpf.replace(/\D/g, ''),
          affiliate_code: code,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      console.log('User table upsert result:', userError)

      if (userError) {
        console.error('Erro ao criar registro de usuário:', userError)
        // Não retornamos erro aqui pois o usuário do auth já foi criado
      }
    }

    // Ativar o afiliado
    const { error: updateError } = await supabase
      .from('affiliates')
      .update({ status: 'active' })
      .eq('id', affiliate.id)

    if (updateError) {
      console.error('Erro ao ativar afiliado:', updateError)
      return NextResponse.json(
        { message: 'Erro ao ativar conta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, email: finalEmail, userId: authData.user?.id })
  } catch (error) {
    console.error('Erro ao ativar afiliado:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}