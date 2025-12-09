"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock, Wallet, DollarSign, ArrowUpRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount)
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function WithdrawalSystem() {
    const [balanceData, setBalanceData] = useState({
        available_balance: 0,
        total_earnings: 0,
        total_withdrawn: 0
    })
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [requesting, setRequesting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    
    // Form state
    const [amount, setAmount] = useState('')
    const [pixKey, setPixKey] = useState('')

    const fetchData = async () => {
        try {
            const res = await fetch('/api/affiliates/withdraw')
            if (!res.ok) throw new Error('Failed to fetch data')
            const data = await res.json()
            
            setBalanceData({
                available_balance: data.available_balance || 0,
                total_earnings: data.total_earnings || 0,
                total_withdrawn: data.total_withdrawn || 0
            })
            setHistory(data.history || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setRequesting(true)

        try {
            const numericAmount = parseFloat(amount.replace(',', '.'))
            
            if (isNaN(numericAmount) || numericAmount < 50) {
                throw new Error('O valor mínimo é R$ 50,00')
            }

            const res = await fetch('/api/affiliates/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: numericAmount,
                    pix_key: pixKey
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao solicitar saque')
            }

            setSuccess('Solicitação realizada com sucesso!')
            setAmount('')
            setPixKey('')
            // Refresh data
            fetchData()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setRequesting(false)
        }
    }

    if (loading) return <div className="p-4 text-center">Carregando carteira...</div>

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Saldo Disponível
                        </CardTitle>
                        <div className="text-3xl font-bold text-primary">
                            {formatCurrency(balanceData.available_balance)}
                        </div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Ganhos Totais
                        </CardTitle>
                        <div className="text-3xl font-bold">
                            {formatCurrency(balanceData.total_earnings)}
                        </div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4" /> Total Sacado
                        </CardTitle>
                        <div className="text-3xl font-bold text-muted-foreground">
                            {formatCurrency(balanceData.total_withdrawn)}
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request Form */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Solicitar Saque</CardTitle>
                        <CardDescription>Receba via PIX em até 7 dias úteis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>{success}</AlertDescription>
                                </Alert>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor (R$)</Label>
                                <Input 
                                    id="amount" 
                                    placeholder="0,00" 
                                    value={amount}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                    type="number"
                                    min={50}
                                    step="0.01"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Mínimo: R$ 50,00</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="pix">Chave PIX</Label>
                                <Input 
                                    id="pix" 
                                    placeholder="CPF, Email ou Celular" 
                                    value={pixKey}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPixKey(e.target.value)}
                                    required
                                />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={requesting || balanceData.available_balance < 50}
                            >
                                {requesting ? 'Solicitando...' : 'Solicitar Saque'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* History Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Histórico de Saques</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Chave PIX</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Nenhum saque realizado ainda.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{formatDate(item.created_at)}</TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(item.amount)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">
                                                    {item.pix_key}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        item.status === 'paid' ? 'default' : 
                                                        item.status === 'rejected' ? 'destructive' : 'secondary'
                                                    }>
                                                        {item.status === 'paid' ? 'Pago' : 
                                                         item.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
