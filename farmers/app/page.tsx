'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, ScanFace, CheckCircle2, Loader2, Fingerprint } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { setSession, getSession } from '../lib/auth';

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Aadhaar specific states
  const [aadhaarScanning, setAadhaarScanning] = useState(false);
  const [fetchedAadhaar, setFetchedAadhaar] = useState<any>(null);

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
        photoUrl: data.photo_url || null,
        role: 'FARMER'
      });
      router.push('/dashboard');
    }
  };

  const fetchAadhaarDetails = async () => {
    if (aadhaar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setError('');
    setAadhaarScanning(true);
    
    // Simulate biometric matching delay for cool effect
    setTimeout(async () => {
      const { data, error } = await supabase
        .from('mock_aadhaar_db')
        .select('*')
        .eq('aadhaar_number', aadhaar)
        .single();
        
      setAadhaarScanning(false);
      
      if (error || !data) {
        setError('Aadhaar not found in UIDAI database. Ensure you use the sample datasets.');
        return;
      }
      
      setFetchedAadhaar(data);
      setPhone(data.phone_number);
    }, 2500);
  };

  const handleSignup = async () => {
    if (step === 1) {
      if (!fetchedAadhaar) {
        setError('Please fetch Aadhaar details first');
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
          full_name: fetchedAadhaar.full_name,
          phone_number: fetchedAadhaar.phone_number,
          aadhaar_hash: 'mock_' + aadhaar.slice(-4),
          address: fetchedAadhaar.address,
          dob: fetchedAadhaar.dob,
          photo_url: fetchedAadhaar.photo_url,
          role: 'FARMER',
          farmer_uid: farmerUid
        }])
        .select()
        .single();
      
      setLoading(false);
      
      if (error) {
        setError('Error creating account. You may already be registered.');
        return;
      }
      
      setSession({
        userId: data.id,
        name: data.full_name,
        phone: data.phone_number,
        farmerUid: data.farmer_uid,
        photoUrl: data.photo_url,
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
          onClick={() => { setShowSignup(true); setShowLogin(false); setStep(1); setError(''); setFetchedAadhaar(null); setAadhaar(''); }}
          className="flex-1 bg-white text-primary-600 py-3 px-6 rounded-xl shadow-md hover:bg-gray-50 font-semibold transition border border-primary-200"
        >
          Sign Up (New Farmer)
        </button>
      </div>

      {(showLogin || showSignup) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            <button onClick={() => { setShowLogin(false); setShowSignup(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold z-10">X</button>
            <h3 className="text-xl font-bold mb-4">{showLogin ? 'Farmer Login' : 'Secure e-KYC Signup'}</h3>
            
            {error && <div className="mb-4 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

            {step === 1 ? (
              <div className="space-y-4">
                
                {/* LOGIN FLOW */}
                {showLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Registered Phone" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number (Last 4 digits or Full)</label>
                      <input type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary-500" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX XXXX 1234" />
                    </div>
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-bold hover:bg-primary-700 shadow-md mt-4"
                    >
                      Send OTP
                    </button>
                  </>
                )}

                {/* SIGNUP FLOW WITH AADHAAR */}
                {showSignup && !fetchedAadhaar && (
                  <div className="flex flex-col items-center py-4">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
                      {aadhaarScanning ? (
                        <>
                          <ScanFace className="w-12 h-12 text-blue-500 animate-pulse" />
                          <div className="absolute inset-0 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </>
                      ) : (
                        <Fingerprint className="w-12 h-12 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enter 12-Digit Aadhaar</label>
                      <input type="text" className="w-full border-2 border-gray-200 rounded-lg p-3 text-center text-xl tracking-widest focus:border-blue-500 focus:ring-0" value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="999999999991" maxLength={12} disabled={aadhaarScanning} />
                    </div>

                    <button 
                      onClick={fetchAadhaarDetails}
                      disabled={aadhaarScanning || !aadhaar}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md mt-6 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                      {aadhaarScanning ? <><Loader2 className="w-5 h-5 animate-spin"/> Authenticating UIDAI...</> : 'Fetch Details from Aadhaar'}
                    </button>
                  </div>
                )}

                {/* SIGNUP FLOW - FETCHED DATA VIEW */}
                {showSignup && fetchedAadhaar && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> VERIFIED</div>
                      
                      <div className="flex gap-4 items-center">
                        <img src={fetchedAadhaar.photo_url} alt="Aadhaar Photo" className="w-20 h-24 object-cover rounded-lg shadow-sm border-2 border-white" />
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{fetchedAadhaar.full_name}</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">DOB: {fetchedAadhaar.dob}</p>
                          <p className="text-sm text-gray-600 mt-0.5 font-medium">{fetchedAadhaar.gender}</p>
                          <p className="text-sm text-gray-800 font-bold mt-1">+91 {fetchedAadhaar.phone_number}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-green-200">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Address</p>
                        <p className="text-xs text-gray-800 mt-1 leading-relaxed">{fetchedAadhaar.address}</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleSignup}
                      className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 shadow-md"
                    >
                      Send OTP to +91 {fetchedAadhaar.phone_number}
                    </button>
                    <button onClick={() => setFetchedAadhaar(null)} className="w-full text-center text-sm text-gray-500 mt-3 hover:text-gray-800">Use different Aadhaar</button>
                  </div>
                )}

              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="text-center mb-6">
                  <p className="text-gray-600">We have sent a 6-digit OTP to your registered phone.</p>
                </div>
                <div>
                  <input type="text" className="w-full border-2 rounded-xl p-4 focus:ring-0 focus:border-primary-500 text-center text-3xl tracking-[0.5em] font-bold" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="------" />
                  <p className="text-center text-xs text-gray-400 mt-2">Mock OTP is 123456</p>
                </div>
                <button 
                  onClick={showLogin ? handleLogin : handleSignup}
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}