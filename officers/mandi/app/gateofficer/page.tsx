"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { USERS, login, getSession } from '../../lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('gate.officer.v2@mandi');
  const [password, setPassword] = useState('Gate@V2');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login('gate', email, password)) {
      router.push('/gateofficer/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-primary-500">
        <h1 className="text-2xl font-bold text-center text-primary-700 mb-2">UPAJ SETU V2</h1>
        <h2 className="text-xl font-medium text-center text-gray-600 mb-6">Gate Officer Portal</h2>
        
        {error && <div className="text-red-500 mb-4 text-center bg-red-50 p-2 rounded text-sm">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary-500 outline-none" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-primary-600 text-white font-medium p-2.5 rounded-md hover:bg-primary-700 transition-colors mt-2"
          >
            Login
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-gray-100 text-sm text-gray-500 text-center">
          <p className="font-medium text-gray-700 mb-1">Demo Credentials:</p>
          <p className="bg-gray-100 py-1 px-2 rounded inline-block">gate.officer.v2@mandi</p>
          <p className="bg-gray-100 py-1 px-2 rounded inline-block mt-1">Gate@V2</p>
        </div>
      </div>
    </div>
  );
}
