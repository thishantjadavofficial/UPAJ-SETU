"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, getSession, MOCK_USER } from '../lib/auth';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('mandi.officer.v2@mandi');
  const [password, setPassword] = useState('Mandi@V2');
  const [error, setError] = useState('');

  useEffect(() => {
    if (getSession()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mandi Officer Portal</h1>
          <p className="text-gray-500 mt-2">UPAJ SETU V2 APMC System</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="officer@mandi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-2">Demo Credentials:</p>
          <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono text-gray-600">
            <p>Email: {MOCK_USER.email}</p>
            <p>Pass: {MOCK_USER.password}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
