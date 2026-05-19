import type { Metadata } from 'next'
import { Geist, Geist_Mono, Montserrat, Anton, Quicksand, Great_Vibes, Sacramento, Cinzel } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
// Embroidery preview fonts (loaded so the in-app text preview matches the user's chosen font)
const _montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-montserrat" });
const _anton      = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const _quicksand  = Quicksand({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-quicksand" });
const _greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes" });
const _sacramento = Sacramento({ subsets: ["latin"], weight: "400", variable: "--font-sacramento" });
const _cinzel     = Cinzel({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: 'TinyThread Studio',
  description: 'Custom embroidery design studio - Upload photos and preview your embroidery on garments',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${_montserrat.variable} ${_anton.variable} ${_quicksand.variable} ${_greatVibes.variable} ${_sacramento.variable} ${_cinzel.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
