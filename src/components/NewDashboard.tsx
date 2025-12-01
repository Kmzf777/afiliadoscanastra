"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Copy, Download, TrendingUp, DollarSign, User, Clock, Trophy } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

interface Sale {
  id: string;
  created_at: string;
  codigo_usado: string;
  payment_link_status: boolean;
  nome?: string; // assuming 'nome' or 'name' or 'customer_name'
  customer_name?: string;
}

interface DashboardProps {
  user: any;
}

export default function NewDashboard({ user }: DashboardProps) {
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ranking, setRanking] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch sales and affiliate code from API (bypasses RLS issues)
        const salesRes = await fetch('/api/affiliates/sales');
        if (!salesRes.ok) throw new Error('Failed to fetch sales data');
        
        const { sales: salesData, affiliateCode: code } = await salesRes.json();
        
        setAffiliateCode(code);
        setSales(Array.isArray(salesData) ? [...salesData].sort((a: any, b: any) => {
            const da = a.created_at ? new Date(a.created_at).getTime() : 0
            const db = b.created_at ? new Date(b.created_at).getTime() : 0
            return db - da
        }) : []);

        if (code) {
            // 3. Get Ranking
            try {
                // Fetch all sales to calculate ranking locally if API doesn't return rank directly
                // Or use the ranking API if it supports getting rank for a specific code
                // For now, we stick to the client-side calculation approach using the same API if possible, 
                // or simpler: fetch ranking from API and find our user.
                
                const rankingRes = await fetch('/api/affiliates/ranking');
                if (rankingRes.ok) {
                    const rankingData = await rankingRes.json();
                    // rankingData is likely an array of { name, salesCount, ... }
                    // We need to find where our current user stands.
                    // If rankingData doesn't have code, we match by name? Risky.
                    // Let's try to match by name from user metadata if available.
                    
                    // Alternative: The ranking API logic I saw earlier returns grouped data. 
                    // Let's just assume we can find it or use the sales count to estimate.
                    
                    // Actually, let's use the sales count we just fetched (salesData.length) 
                    // and compare with the ranking list counts.
                    const mySalesCount = salesData.length;
                    
                    // If rankingData is sorted by salesCount desc
                    // We can find the first index where count <= mySalesCount? 
                    // No, we need to count how many people have MORE sales.
                    
                    if (Array.isArray(rankingData)) {
                         const myEntryIndex = rankingData.findIndex((r: any) => String(r.id) === String(code))
                         if (myEntryIndex !== -1) {
                             setRanking(myEntryIndex + 1)
                         } else {
                             // fallback: compute by comparing mySalesCount against list sorted desc by r.sales
                             const sorted = [...rankingData].sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0))
                             const idx = sorted.findIndex((r: any) => (r.sales || 0) <= mySalesCount)
                             setRanking(idx !== -1 ? idx + 1 : sorted.length + 1)
                         }
                    }
                }
            } catch (e) {
                console.error("Error calculating rank", e);
            }
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Process Chart Data
  const chartData = useMemo(() => {
    const confirmedSales = sales.filter(s => s.payment_link_status === true)
    if (!confirmedSales.length) return { sevenDays: [], fifteenDays: [], total: [] };

    const processSales = (days: number | null) => {
        const now = new Date();
        const dataMap: Record<string, number> = {};
        
        // Initialize last 'days' days with 0
        if (days) {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                dataMap[key] = 0;
            }
        }

        confirmedSales.forEach(sale => {
            const date = new Date(sale.created_at);
            // Filter by days if specified
            if (days) {
                const diffTime = Math.abs(now.getTime() - date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays > days) return;
            }
            
            const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            // For total chart, we might want to group by month or week if too long, but let's stick to daily for now or maybe grouped by date found.
            // If days is null (Total), we just use the date key.
            if (!days && !dataMap[key]) dataMap[key] = 0;

            if (days || dataMap[key] !== undefined) {
                dataMap[key] = (dataMap[key] || 0) + 5; // R$ 5,00 per sale
            }
        });

        return Object.entries(dataMap).map(([date, value]) => ({ date, value }));
    };

    return {
        sevenDays: processSales(7),
        fifteenDays: processSales(15),
        total: processSales(null).sort((a, b) => {
             const [dayA, monthA] = a.date.split('/');
             const [dayB, monthB] = b.date.split('/');
             const year = new Date().getFullYear();
             return new Date(year, parseInt(monthA)-1, parseInt(dayA)).getTime() - new Date(year, parseInt(monthB)-1, parseInt(dayB)).getTime();
        }) 
    };
  }, [sales]);

  const copyToClipboard = () => {
    if (!affiliateCode) return;
    const url = `https://amostra.cafecanastra.com/?code=${affiliateCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const downloadQRCode = async () => {
    if (!affiliateCode) return;
    const url = `https://amostra.cafecanastra.com/?code=${affiliateCode}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qrcode-canastra-${affiliateCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
     return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header/Nav */}
      <header className="border-b bg-card p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <img src="/logo-canastra.png" alt="Logo Canastra" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground">Código: {affiliateCode ?? user?.user_metadata?.affiliate_code ?? '-'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-primary">
                {/* Placeholder for user image */}
                <User className="h-6 w-6 text-gray-500" />
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-xl border">
            <div className="flex items-center gap-6">
                <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background shadow-xl overflow-hidden bg-white relative">
                     {/* Profile Picture */}
                     <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <User className="h-12 w-12 text-gray-400" />
                     </div>
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Olá, {user.user_metadata?.name || 'Afiliado'}!</h1>
                    <p className="text-muted-foreground">Bem-vindo ao seu painel de controle.</p>
                </div>
            </div>
            <div className="flex flex-col items-center md:items-end">
                <div className="flex items-center gap-2 text-amber-600">
                    <Trophy className="h-6 w-6" />
                    <span className="text-lg font-semibold">Ranking Global</span>
                </div>
                <div className="text-4xl font-bold text-primary">
                    #{ranking !== null ? ranking : '-'}
                </div>
                <p className="text-xs text-muted-foreground">em vendas totais</p>
            </div>
        </section>

        {/* Metrics Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Vendas Confirmadas</CardTitle>
                    <div className="text-3xl font-bold">{sales.filter(s => s.payment_link_status === true).length}</div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Filtradas por payment_link_status=true</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Receita Estimada</CardTitle>
                    <div className="text-3xl font-bold">{formatCurrency(sales.filter(s => s.payment_link_status === true).length * 5)}</div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Cada venda equivale a R$ 5,00</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Última Venda</CardTitle>
                    <div className="text-3xl font-bold">
                        {sales.length > 0 
                          ? `${new Date(sales[0].created_at).toLocaleDateString('pt-BR')} ${new Date(sales[0].created_at).toLocaleTimeString('pt-BR')}`
                          : '-'}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Baseado em ordenação desc por created_at</p>
                </CardContent>
            </Card>
        </section>

        {/* Promotion Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Seu Link de Afiliado</CardTitle>
                    <CardDescription>Compartilhe este link para ganhar comissões.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <div className="flex-1 bg-muted p-2 rounded border text-sm font-mono truncate">
                        https://amostra.cafecanastra.com/?code={affiliateCode ?? user?.user_metadata?.affiliate_code ?? ''}
                    </div>
                    <Button onClick={copyToClipboard} size="icon" variant="outline">
                        <Copy className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Seu QR Code</CardTitle>
                    <CardDescription>Baixe o QR Code para materiais impressos ou digitais.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={downloadQRCode} className="w-full gap-2">
                        <Download className="h-4 w-4" /> Baixar QR Code
                    </Button>
                </CardContent>
            </Card>
        </section>

        {/* Charts Section */}
        <section className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" /> Desempenho de Vendas
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard title="Últimos 7 Dias" data={chartData.sevenDays} color="#3b82f6" />
                <ChartCard title="Últimos 15 Dias" data={chartData.fifteenDays} color="#8b5cf6" />
                <ChartCard title="Total" data={chartData.total} color="#10b981" />
            </div>
        </section>

        {/* Latest Sales Section */}
        <section>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" /> Últimas Vendas
                    </CardTitle>
                    <CardDescription>Acompanhe suas vendas em tempo real.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                            {sales.length === 0 ? (
                                <p className="p-8 text-center text-muted-foreground">Nenhuma venda registrada ainda.</p>
                            ) : (
                                sales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{sale.nome || sale.customer_name || 'Cliente Anônimo'}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(sale.created_at).toLocaleDateString('pt-BR')} às {new Date(sale.created_at).toLocaleTimeString('pt-BR')}
                                            </span>
                                        </div>
                                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 gap-1">
                                            <DollarSign className="h-3 w-3" /> + R$ 5,00
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </section>

      </main>
    </div>
  );
}

function ChartCard({ title, data, color }: { title: string, data: { date: string, value: number }[], color: string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
                <div className="text-2xl font-bold">
                    {formatCurrency(data.reduce((acc, curr) => acc + curr.value, 0))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tickMargin={10}
                            />
                            <YAxis 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <RechartsTooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke={color} 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: color }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
