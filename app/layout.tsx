import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gym Log',
  description: 'Registro personal de entrenamientos',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${bebasNeue.variable} ${dmSans.variable}`}
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
