import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { message: 'Código inválido. Digite 6 números.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServer()

    // Buscar código nos afiliados (6 dígitos ou 9 dígitos com LIKE)
    let { data: affiliate, error } = await supabase
      .from('affiliates')
      .select('id, code, status')
      .or(`code.eq.${code},code.like.${code}%`)
      .single()

    if (error || !affiliate) {
      return NextResponse.json(
        { message: 'Código não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      affiliate: {
        id: affiliate.id,
        code: affiliate.code,
        status: affiliate.status,
      },
    })
  } catch (error) {
    console.error('Erro ao validar código:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}