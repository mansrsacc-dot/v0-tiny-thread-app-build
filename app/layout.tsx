import type { Metadata } from 'next'
import { Geist, Geist_Mono, Montserrat, Anton, Quicksand, Great_Vibes, Sacramento } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'TinyThread Studio',
  description: 'AI-powered embroidery design studio - Upload photos and preview custom embroidery on garments',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
      className={`${_montserrat.variable} ${_anton.variable} ${_quicksand.variable} ${_greatVibes.variable} ${_sacramento.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
