export const metadata = {
  title: 'Afiliados Café Canastra',
  description: 'Seja um afiliado do Café Canastra e ganhe comissões',
}

import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}