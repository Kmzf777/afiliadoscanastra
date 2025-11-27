"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const FloatingLoginButton = () => {
  const [isPastHero, setIsPastHero] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the hero section (100vh)
      // We use a small offset to ensure smooth transition slightly before the exact edge if needed,
      // but "depois da hero" strictly means > window.innerHeight.
      // Let's use window.innerHeight - 100 for a bit of anticipation or just window.innerHeight.
      // User said "depois da hero", so strictly > hero height.
      const heroHeight = window.innerHeight
      setIsPastHero(window.scrollY > heroHeight - 80) // Changing slightly before the end of hero looks better usually
    }

    window.addEventListener("scroll", handleScroll)
    // Initial check
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <Link
      href="/login"
      className={cn(
        "fixed top-6 right-6 z-50 px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center justify-center",
        isPastHero
          ? "bg-black text-white shadow-lg hover:bg-gray-900" // Past hero: Filled Black
          : "bg-transparent text-white border border-white/30 hover:bg-white/10 backdrop-blur-sm" // Over hero: Outlined/Vazado
      )}
    >
      ENTRAR
    </Link>
  )
}
