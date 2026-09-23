import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weight Portal V2',
  description: 'UPAJ SETU V2 Weight Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
