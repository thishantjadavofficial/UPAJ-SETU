'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { setSession, getSession } from '../lib/auth';

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async () => {
    if (step === 1) {
      if (!phone || !aadhaar) {
        setError('Please enter phone and Aadhaar');
        return;
      }
      setError('');
      setStep(2);
    } else {
      if (otp !== '123456') {
        setError('Invalid OTP');
        return;
      }
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phone)
        .eq('role', 'FARMER')
        .single();
      
      setLoading(false);
      
      if (error || !data) {
        setError('User not found. Please sign up.');
        setStep(1);
        setShowLogin(false);
        return;
      }
      
      setSession({
        userId: data.id,
        name: data.full_name,
        phone: data.phone_number,
        farmerUid: data.farmer_uid,
        role: 'FARMER'
      });
      router.push('/dashboard');
    }
  };

  const handleSignup = async () => {
    if (step === 1) {
      if (!name || !phone || !aadhaar) {
        setError('Please enter all details');
        return;
      }
      setError('');
      setStep(2);
    } else {
      if (otp !== '123456') {
        setError('Invalid OTP');
        return;
      }
      setLoading(true);
      setError('');
      const farmerUid = 'F-' + Math.floor(1000 + Math.random() * 9000);
      const { data, error } = await supabase
        .from('users')
        .insert([{
          full_name: name,
          phone_number: phone,
          aadhaar_hash: 'mock_' + aadhaar.slice(-4),
          role: 'FARMER',
          farmer_uid: farmerUid
        }])
        .select()
        .single();
      
      setLoading(false);
      
      if (error) {
        setError('Error creating account. Phone may already exist.');
        return;
      }
      
      setSession({
        userId: data.id,
        name: data.full_name,
        phone: data.phone_number,
        farmerUid: data.farmer_uid,
        role: 'FARMER'
      });
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-primary-100 p-4">
      <div className="text-center mb-12">
        <div className="bg-white p-4 rounded-full shadow-lg inline-block mb-4">
          <Leaf className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-5xl font-bold text-primary-800 mb-2">Kisaan Portal</h1>
        <h2 className="text-2xl font-medium text-primary-600">Upaj Setu</h2>
        <p className="mt-4 text-gray-600 max-w-md mx-auto">APMC Smart Mandi Queue Management System for Farmers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={() => { setShowLogin(true); setShowSignup(false); setStep(1); setError(''); }}
          className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-xl shadow-md hover:bg-primary-700 font-semibold transition"
        >
          Login
        </button>
        <button 
          onClick={() => { setShowSignup(true); setShowLogin(false); setStep(1); setError(''); }}
          className="flex-1 bg-white text-primary-600 py-3 px-6 rounded-xl shadow-md hover:bg-gray-50 font-semibold transition border border-primary-200"
        >
          Sign Up
        </button>
      </div>

      {(showLogin || showSignup) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => { setShowLogin(false); setShowSignup(false); }} className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold">X</button>
            <h3 className="text-xl font-bold mb-4">{showLogin ? 'Login' : 'Sign Up'}</h3>
            
            {error && <div className="mb-4 text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

            {step === 1 ? (
              <div className="space-y-4">
                {showSignup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ram Kumar" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Any sample phone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                  <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="Any sample Aadhaar" />
                </div>
                <button 
                  onClick={showLogin ? handleLogin : handleSignup}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700"
                >
                  Send OTP
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP (Mock: 123456)</label>
                  <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500 text-center text-lg tracking-widest" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="------" />
                </div>
                <button 
                  onClick={showLogin ? handleLogin : handleSignup}
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}