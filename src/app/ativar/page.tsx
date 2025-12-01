'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AtivarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || ''
  
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Color tokens matching Home Page
  const colors = {
    textMain: "#ffffff",
    textSecondary: "#94a3b8",
    primary: "#f97316",
    success: "#10b981",
    inputBg: "#27272a",
    baseBg: "#09090b",
    inputShadow: "rgba(255, 255, 255, 0.1)",
    cardBg: "#18181b",
    cardBorder: "rgba(255, 255, 255, 0.1)"
  }

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return cleaned.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setCpf(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('CPF inválido. Informe os 11 dígitos.')
      return
    }

    setIsLoading(true)

    try {
      console.log('Enviando dados de ativação:', { code, cpf: cpfLimpo })
      
      const response = await fetch('/api/affiliates/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          cpf: cpfLimpo,
          password,
        }),
      })

      const data = await response.json()
      console.log('Resposta da ativação:', data)

      if (response.ok) {
        if (data?.email) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password,
          })
          console.log('Resultado do login pós-ativação:', loginData, loginError)
          if (loginError) {
            setError('Conta ativada, mas houve erro ao fazer login. Acesse pela página de login.')
          } else {
            router.push('/dashboard')
          }
        } else {
          // Fallback: se não veio email, redireciona para login
          router.push('/login')
        }
      } else {
        setError(data.message || 'Erro ao ativar conta. Verifique seus dados.')
      }
    } catch (error) {
      console.error('Erro na ativação:', error)
      setError('Erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
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
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>

      {/* Main Background Container */}
      <div
        className="absolute inset-0 w-full h-full"
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
      </div>

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-md px-4 animate-bounce-in">
        <div className="mb-6 text-center">
           <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
           </Link>
        </div>

        <div 
          className="backdrop-blur-md rounded-2xl shadow-2xl p-8 border"
          style={{
            backgroundColor: "rgba(24, 24, 27, 0.8)", // Dark card background with some transparency
            borderColor: colors.cardBorder
          }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: colors.textMain }}>
              Ativar seu Código
            </h1>
            <p style={{ color: colors.textSecondary }}>
              Código: <span className="font-mono font-bold" style={{ color: colors.primary }}>{code}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                CPF
              </label>
              <input
                type="text"
                id="cpf"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all focus:ring-2 focus:ring-primary-500/50 border"
                style={{
                  backgroundColor: colors.inputBg,
                  color: colors.textMain,
                  borderColor: colors.inputShadow,
                  outlineColor: colors.primary
                }}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all focus:ring-2 focus:ring-primary-500/50 border pr-12"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textMain,
                    borderColor: colors.inputShadow,
                    outlineColor: colors.primary
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all focus:ring-2 focus:ring-primary-500/50 border pr-12"
                  style={{
                    backgroundColor: colors.inputBg,
                    color: colors.textMain,
                    borderColor: colors.inputShadow,
                    outlineColor: colors.primary
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !cpf || !password || !confirmPassword}
              className="w-full inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-full shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.primary,
                color: colors.textMain
              }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Ativar Conta'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
