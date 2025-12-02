import { Car, Coffee, Briefcase, Dumbbell, Train } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function EarningsExplanation() {
  return (
    <section className="py-20 px-4 bg-[#09090b] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            E SE CADA PESSOA QUE VÊ <br className="hidden md:block" />
            SEU CARRO <span className="text-primary">VALESSE R$5?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Você circula pela cidade de qualquer jeito. No carro, no metrô, 
            na cafeteria, no trabalho, na academia.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-muted-foreground/60">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <Car className="w-4 h-4" /> Carro
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <Train className="w-4 h-4" /> Metrô
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <Coffee className="w-4 h-4" /> Cafeteria
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <Briefcase className="w-4 h-4" /> Trabalho
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <Dumbbell className="w-4 h-4" /> Academia
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">
                Cada pessoa que escanear esse QR Code e pedir a amostra grátis? 
                <span className="text-primary block mt-1">Você embolsa R$5.</span>
              </h3>
              <p className="text-muted-foreground">
                É simples assim. Sem pegadinhas. Alguém viu seu adesivo, scaneou, pediu a amostra? O dinheiro cai na sua conta.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-card/50 border-primary/20 overflow-hidden">
                <CardContent className="p-0 flex">
                  <div className="bg-primary/20 w-24 flex items-center justify-center p-4">
                    <span className="text-2xl font-bold text-primary">10</span>
                  </div>
                  <div className="p-4 flex items-center justify-between w-full">
                    <span className="font-medium text-muted-foreground">escaneadas</span>
                    <span className="text-xl font-bold text-white">= R$50 pra você</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20 overflow-hidden">
                <CardContent className="p-0 flex">
                  <div className="bg-primary/20 w-24 flex items-center justify-center p-4">
                    <span className="text-2xl font-bold text-primary">50</span>
                  </div>
                  <div className="p-4 flex items-center justify-between w-full">
                    <span className="font-medium text-muted-foreground">escaneadas</span>
                    <span className="text-xl font-bold text-white">= R$250 pra você</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-xl -z-10" />
            <div className="bg-card border border-border rounded-3xl p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <div className="w-32 h-32 bg-primary rounded-full blur-3xl" />
              </div>
              
              <div className="space-y-4 relative z-10">
                <h4 className="text-xl font-bold text-white">
                  Cole no carro, na mochila, no laptop, onde fizer sentido.
                </h4>
                <p className="text-muted-foreground">
                  O adesivo na gaveta não te paga nada.
                </p>
                <p className="text-lg font-medium text-primary">
                  Mas colado por aí? Você ganha toda vez que alguém descobrir o Café Canastra através de você.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
