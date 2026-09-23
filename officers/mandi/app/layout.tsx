import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'APMC Mandi Officer Portal',
  description: 'UPAJ SETU V2 Mandi Officer Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen text-gray-900">{children}</body>
    </html>
  )
}
