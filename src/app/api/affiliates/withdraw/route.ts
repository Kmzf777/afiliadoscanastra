import { NextResponse } from 'next/server'
import { getSupabaseSSR, getSupabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET: Returns the balance and history
export async function GET() {
    try {
        const supabaseSSR = getSupabaseSSR()
        const { data: { user }, error: authError } = await supabaseSSR.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseServer()

        // 1. Call the secure DB function to get balance
        const { data: balanceData, error: balanceError } = await supabaseAdmin
            .rpc('get_affiliate_balance', { p_user_id: user.id })

        if (balanceError) {
            console.error('Balance Error:', balanceError)
            throw balanceError
        }

        // 2. Get withdrawal history
        const { data: history, error: historyError } = await supabaseAdmin
            .from('withdrawals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (historyError) throw historyError

        return NextResponse.json({
            ...balanceData,
            history
        })

    } catch (error: any) {
        console.error('Withdraw API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Requests a withdrawal
export async function POST(req: Request) {
    try {
        const supabaseSSR = getSupabaseSSR()
        const { data: { user }, error: authError } = await supabaseSSR.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { amount, pix_key } = body

        if (!amount || !pix_key) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        // Call the secure DB function to request withdrawal
        // We use supabaseSSR (authenticated client) so that auth.uid() works in the Postgres function
        const { data: result, error: rpcError } = await supabaseSSR
            .rpc('request_withdrawal', { 
                p_amount: amount, 
                p_pix_key: pix_key 
            })

        if (rpcError) {
            // Return the specific error message from the database (e.g. "Saldo insuficiente")
            return NextResponse.json({ error: rpcError.message }, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('Withdraw API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
