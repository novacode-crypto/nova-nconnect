import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NautaWeb — Gestión de cuenta ETECSA',
  description: 'Gestiona tu cuenta Nauta: conexión, recarga, transferencias e historial.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {/* Línea de scan decorativa */}
        <div className="scan-line" aria-hidden="true" />

        {/* Contenido principal por encima del fondo */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}