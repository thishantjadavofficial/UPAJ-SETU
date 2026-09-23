'use client';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Scale, Landmark } from 'lucide-react';

export default function OfficerPortalSelector() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UPAJ SETU V2</h1>
        <p className="text-gray-500">APMC Unified Officers Portal</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gate Officer */}
        <button onClick={() => router.push('/gateofficer')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Gate Officer</h2>
          <p className="text-sm text-gray-500">Scan QR codes, verify farmer entry, and mark arrival.</p>
        </button>

        {/* Weight Officer */}
        <button onClick={() => router.push('/weightofficer')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Scale className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Weight Officer</h2>
          <p className="text-sm text-gray-500">Record exact crop weights after auction.</p>
        </button>

        {/* Mandi Officer */}
        <button onClick={() => router.push('/mandiofficer')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition flex flex-col items-center text-center group">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Landmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Mandi Officer</h2>
          <p className="text-sm text-gray-500">Monitor APMC live feed, view bills, and manage fees.</p>
        </button>
      </div>
    </div>
  );
}
