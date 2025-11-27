"use client"

import { useEffect, useState } from "react"
import { Trophy, TrendingUp, Medal, Award } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface RankingItem {
  id: string
  name: string
  sales: number
  revenue: number
  avatar: string
  cpf?: string
}

export default function RankingComponent() {
  const [rankingData, setRankingData] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRanking() {
      console.log("RankingComponent: Fetching ranking data...")
      try {
        const response = await fetch('/api/affiliates/ranking')
        console.log("RankingComponent: Response status:", response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log("RankingComponent: Data received:", data.length, "items")
          setRankingData(data)
        } else {
            console.error("RankingComponent: Server returned error")
        }
      } catch (error) {
        console.error("Failed to fetch ranking", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [])

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando ranking...</div>
  }

  const top3 = rankingData.slice(0, 3)
  const restOfRanking = rankingData.slice(3)

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4 mb-20">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase text-primary">
          VEJA QUEM JÁ ATIVOU E COMEÇOU A GANHAR
        </h2>
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-lg text-muted-foreground">
            Essa galera ativou o código e colou os adesivos em lugares aleatórios.
          </p>
          <p className="text-lg font-medium text-foreground">
            Olha quanto já pingou pra eles:
          </p>
        </div>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
        {/* 2nd Place */}
        {top3[1] && (
          <div className="order-2 md:order-1">
            <RankingCard item={top3[1]} rank={2} />
          </div>
        )}
        
        {/* 1st Place */}
        {top3[0] && (
          <div className="order-1 md:order-2 -mt-10 md:-mt-20 z-10">
            <RankingCard item={top3[0]} rank={1} isFirst />
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="order-3 md:order-3">
            <RankingCard item={top3[2]} rank={3} />
          </div>
        )}
      </div>

      {/* Full List */}
      <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Classificação Geral
            </CardTitle>
            <Badge variant="outline" className="font-mono">
              Top {rankingData.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {restOfRanking.length > 0 ? (
              restOfRanking.map((item, index) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-muted-foreground w-6 text-center">
                      {index + 4}
                    </span>
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={item.avatar} alt={item.name} />
                      <AvatarFallback className="font-bold">
                        {item.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        ID: {item.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {item.sales} vendas
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      R$ {item.revenue.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {rankingData.length <= 3 
                  ? "Ainda não há outros afiliados no ranking." 
                  : "Nenhum resultado encontrado."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RankingCard({ item, rank, isFirst = false }: { item: RankingItem; rank: number; isFirst?: boolean }) {
  return (
    <div className={cn(
      "relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl",
      isFirst 
        ? "bg-gradient-to-b from-primary/10 to-background border-primary/20 shadow-lg scale-105" 
        : "bg-card border-border hover:-translate-y-1"
    )}>
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-sm border-2 border-background",
          isFirst ? "bg-yellow-400 text-yellow-950" : 
          rank === 2 ? "bg-slate-300 text-slate-900" : 
          "bg-amber-600 text-white"
        )}>
          {rank}
        </div>
      </div>

      <div className="flex flex-col items-center text-center space-y-3 mt-4">
        <div className="relative">
          <Avatar className={cn(
            "border-4 border-background shadow-md",
            isFirst ? "w-24 h-24" : "w-16 h-16"
          )}>
            <AvatarImage src={item.avatar} alt={item.name} />
            <AvatarFallback className="text-lg font-bold">
              {item.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isFirst && (
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-1.5 border-2 border-background shadow-sm">
              <Trophy className="w-4 h-4 text-yellow-950" />
            </div>
          )}
        </div>

        <div>
          <h3 className={cn("font-bold truncate max-w-[150px]", isFirst ? "text-xl" : "text-lg")}>
            {item.name}
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {item.sales} vendas
          </p>
        </div>

        <Badge variant={isFirst ? "default" : "secondary"} className="mt-2">
          R$ {item.revenue.toFixed(2).replace('.', ',')}
        </Badge>
      </div>
    </div>
  )
}
