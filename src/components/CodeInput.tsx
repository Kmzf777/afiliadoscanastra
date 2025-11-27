import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

interface CodeInputProps {
  onCodeSubmit: (code: string) => void
  isLoading?: boolean
}

export function CodeInput({ onCodeSubmit, isLoading }: CodeInputProps) {
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6)
    if (normalizedCode.length === 6) {
      onCodeSubmit(normalizedCode)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={code}
          onChange={handleInputChange}
          placeholder="000000"
          className="w-full px-4 py-3 text-2xl font-mono text-center tracking-widest border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
          maxLength={6}
          autoFocus
        />
        <button
          type="submit"
          disabled={code.length !== 6 || isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-amber-600 hover:text-amber-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </form>
  )
}