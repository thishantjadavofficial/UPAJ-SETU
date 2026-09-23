"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, getUser } from '@/lib/auth'
import { Scale } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('weight.officer.v2@mandi')
  const [password, setPassword] = useState('Weight@V2')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (getUser()) {
      router.push('/dashboard')
    }
  }, [router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(email, password)) {
      router.push('/dashboard')
    } else {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="bg-primary-100 p-3 rounded-full text-primary-600 mb-4">
            <Scale size={40} />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Weight Officer Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            UPAJ SETU V2 Smart Mandi
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
