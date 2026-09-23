"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, logout } from '../../../lib/auth'
import { Scale, LogOut } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const session = getSession('weight')
    if (!session) {
      router.push('/')
    } else {
      setUser(session)
    }
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 text-primary-600">
              <Scale size={24} />
              <span className="font-bold text-xl text-gray-900">Weighbridge V2</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Hi, {user.name}</span>
              <button
                onClick={() => { logout('weight'); router.push('/') }}
                className="text-gray-500 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
