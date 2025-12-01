"use client"

import { useState, useRef } from "react"
import { useRouter } from 'next/navigation'
import { PinInput } from "@ark-ui/react/pin-input"

export const WaitlistHero = () => {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [status, setStatus] = useState("idle") // 'idle' | 'loading' | 'success'
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '', title: '' })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const showAlert = (message: string, title: string = "Atenção") => {
    setAlertInfo({ isOpen: true, message, title })
  }

  const handleCodeSubmit = async (codeToSubmit: string) => {
    if (!codeToSubmit || codeToSubmit.length < 6) return

    setStatus("loading")
    try {
      const response = await fetch('/api/codes/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeToSubmit }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.valid) {
          if (data.affiliate?.status === 'inactive') {
            setStatus("success")
            fireConfetti()
            setTimeout(() => {
                router.push(`/ativar?code=${code}`)
            }, 1500)
          } else {
            showAlert('Código válido! Porém, este código já está ativo.', 'Código Ativo')
            setStatus("idle")
          }
        }
      } else {
        showAlert(data.message || 'Código inválido. Digite 6 números.', 'Erro')
        setStatus("idle")
      }
    } catch (error) {
      showAlert('Erro ao validar código. Tente novamente.', 'Erro')
      setStatus("idle")
    }
  }

  // --- Confetti Logic ---
  const fireConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const particles: any[] = []
    const colors = ["#f97316", "#10b981", "#fbbf24", "#f472b6", "#fff"]

    // Resize canvas to cover the button area mostly
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const createParticle = () => {
      return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12, // Random spread X
        vy: (Math.random() - 2) * 10, // Upward velocity
        life: 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
      }
    }

    // Create batch of particles
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle())
    }

    const animate = () => {
      if (particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.5 // Gravity
        p.life -= 2

        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.life / 100)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        if (p.life <= 0) {
          particles.splice(i, 1)
          i--
        }
      }

      requestAnimationFrame(animate)
    }

    animate()
  }

  // Color tokens
  const colors = {
    textMain: "#ffffff",
    textSecondary: "#94a3b8",
    primary: "#f97316",
    success: "#10b981", // emerald-500
    inputBg: "#27272a",
    baseBg: "#09090b",
    inputShadow: "rgba(255, 255, 255, 0.1)",
  }

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      {/* Animation Styles */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 60s linear infinite;
        }
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes success-pulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes success-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 60px rgba(16, 185, 129, 0.8), 0 0 100px rgba(16, 185, 129, 0.4); }
        }
        @keyframes checkmark-draw {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes celebration-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-success-pulse {
          animation: success-pulse 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-success-glow {
          animation: success-glow 2s ease-in-out infinite;
        }
        .animate-checkmark {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: checkmark-draw 0.4s ease-out 0.3s forwards;
        }
        .animate-ring {
          animation: celebration-ring 0.8s ease-out forwards;
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>

      {/* Main Container */}
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          backgroundColor: colors.baseBg,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Background Decorative Layer */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            perspective: "1200px",
            transform: "perspective(1200px) rotateX(15deg)",
            transformOrigin: "center bottom",
            opacity: 1,
          }}
        >
          {/* Image Back - spins clockwise */}
          <div className="absolute inset-0 animate-spin-slow">
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                width: "2000px",
                height: "2000px",
                transform: "translate(-50%, -50%) rotate(-180deg)",
                zIndex: 0,
              }}
            >
              <img
                src="/background_2.png"
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
            </div>
          </div>

          {/* Square 2 (Middle) - Removed as per request to use specific images */}
          {/* <div className="absolute inset-0 animate-spin-slow-reverse">...</div> */}

          {/* Image Front - spins clockwise */}
          <div className="absolute inset-0 animate-spin-slow">
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                width: "800px",
                height: "800px",
                transform: "translate(-50%, -50%) rotate(48.33deg)",
                zIndex: 2,
              }}
            >
              <img
                src="/background_1.png"
                alt="App Icon"
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${colors.baseBg} 10%, rgba(9, 9, 11, 0.8) 40%, transparent 100%)`,
          }}
        />

        {/* Content Container */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center pb-24 gap-8">
          
          <h1 className="text-4xl md:text-6xl font-bold text-center tracking-tight px-4" style={{ color: colors.textMain }}>
            ATIVE SEU CODIGO E<br />COMECE A GANHAR
          </h1>

          {/* Form / Success Container */}
          <div className="w-full max-w-md px-4 relative perspective-1000 flex flex-col items-center gap-6">
            {/* Confetti Canvas - overlays everything but ignores clicks */}
            <canvas
              ref={canvasRef}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-50"
            />

            {/* PIN INPUT */}
            <div className={`transition-all duration-500 ${status === 'success' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <PinInput.Root 
                    onValueChange={(e) => setCode(e.valueAsString)}
                    onValueComplete={(e) => handleCodeSubmit(e.valueAsString)} 
                    disabled={status === 'loading'}
                    autoFocus
                >
                  <PinInput.Control className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((_, index) => (
                      <PinInput.Input
                        key={index}
                        index={index}
                        maxLength={1}
                        className="w-12 h-14 text-center text-2xl font-bold border rounded-lg transition-all focus:outline-hidden focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                        style={{
                            backgroundColor: colors.inputBg,
                            color: colors.textMain,
                            borderColor: colors.inputShadow,
                        }}
                      />
                    ))}
                  </PinInput.Control>
                  <PinInput.HiddenInput />
                </PinInput.Root>
            </div>
            
            {/* SUCCESS STATE */}
            {status === "success" && (
            <div
              className="absolute inset-0 flex items-center justify-center h-[60px]"
            >
                <div
                    className="flex items-center gap-2 text-white font-semibold text-lg animate-bounce-in"
                >
                    <div className="bg-white/20 p-1 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            className="animate-checkmark"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                        />
                        </svg>
                    </div>
                    <span>Código ativado! Redirecionando...</span>
                </div>
            </div>
            )}

            {/* BUTTON */}
             <div className={`transition-all duration-500 ${status === 'success' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <button
                  onClick={() => handleCodeSubmit(code)}
                  disabled={status === "loading"}
                  className="h-12 px-8 rounded-full font-medium text-white transition-all active:scale-95 hover:brightness-110 disabled:hover:brightness-100 disabled:active:scale-100 disabled:cursor-wait flex items-center justify-center min-w-[130px]"
                  style={{ backgroundColor: colors.primary }}
                >
                  {status === "loading" ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    "ATIVAR"
                  )}
                </button>
             </div>
          </div>
        </div>

        {/* ALERT MODAL */}
        {alertInfo.isOpen && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-[#18181b] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-bounce-in flex flex-col items-center text-center gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                {alertInfo.title && <h3 className="text-xl font-bold text-white">{alertInfo.title}</h3>}
                <p className="text-gray-300">{alertInfo.message}</p>
                <button
                onClick={() => setAlertInfo(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: colors.primary }}
                >
                Fechar
                </button>
            </div>
            </div>
        )}
      </div>
    </div>
  )
}
