'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, Plus, Leaf, User, History, Home, ReceiptText, CheckCircle2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getSession, clearSession } from '../../lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [session, setSessionData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [loading, setLoading] = useState(true);

  // Home Data
  const [todayTokens, setTodayTokens] = useState<any[]>([]);

  // History Data
  const [historyTokens, setHistoryTokens] = useState<any[]>([]);
  
  // Profile Data
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push('/');
    } else {
      setSessionData(s);
      loadAllData(s.farmerUid, s.userId);
    }
  }, [router]);

  const loadAllData = async (uid: string, userId: string) => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch Today's Tokens
    const { data: tTokens } = await supabase
      .from('master_tokens')
      .select('*, crop_sub_lots(*)')
      .eq('farmer_uid', uid)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    if (tTokens) setTodayTokens(tTokens);

    // 2. Fetch History & Bills (All tokens)
    const { data: hTokens } = await supabase
      .from('master_tokens')
      .select('*, crop_sub_lots(*), v2_bills(*)')
      .eq('farmer_uid', uid)
      .order('created_at', { ascending: false });
    if (hTokens) setHistoryTokens(hTokens);

    // 3. Fetch Profile
    const { data: pData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (pData) setProfileData(pData);

    setLoading(false);
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  if (loading || !session) return <div className="min-h-screen flex items-center justify-center text-primary-600 font-bold">Loading...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* HEADER */}
      <div className="bg-primary-600 text-white p-6 rounded-b-3xl shadow-md z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Leaf className="w-4 h-4" />
              <h1 className="text-xs font-bold uppercase tracking-widest">Upaj Setu</h1>
            </div>
            <h2 className="text-3xl font-bold">{session.name}</h2>
            <p className="opacity-90 mt-1 text-sm">+91 {session.phone}</p>
          </div>
          
          <button onClick={() => setActiveTab('profile')} className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform bg-primary-700 flex items-center justify-center flex-shrink-0">
            {profileData?.photo_url ? (
              <img src={profileData.photo_url} alt="PFP" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 flex-1">
        {/* ===================== TAB: HOME ===================== */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col items-center">
              <p className="text-sm text-gray-500 font-medium mb-3">Mandi Entry QR</p>
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                <QRCodeSVG value={JSON.stringify({ uid: session.farmerUid })} size={180} />
              </div>
              <p className="mt-4 text-xl font-bold text-gray-800 tracking-wider bg-gray-50 px-4 py-1 rounded-full border">
                {session.farmerUid}
              </p>
            </div>

            <h3 className="font-bold text-lg text-gray-800 mb-3 px-1">Today's Tokens</h3>
            {todayTokens.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500 mb-4">No tokens booked for today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayTokens.map(token => (
                  <div key={token.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center border-b pb-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Token No</p>
                        <p className="font-bold text-lg">{token.token_number}</p>
                      </div>
                      <span className={"px-3 py-1 rounded-full text-xs font-bold " + 
                        (token.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' : 
                         token.status === 'ARRIVED' ? 'bg-yellow-100 text-yellow-700' : 
                         'bg-green-100 text-green-700')}
                      >
                        {token.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {token.crop_sub_lots?.map((lot: any) => (
                        <div key={lot.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{lot.crop_name}</span>
                            <span className="text-xs text-gray-500">{lot.estimated_weight} Qtl</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-white border rounded text-gray-600">
                            {lot.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button onClick={() => router.push('/book')} className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
              <Plus className="w-5 h-5" /> Book a New Slot
            </button>
          </div>
        )}

        {/* ===================== TAB: HISTORY & BILLS ===================== */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2 px-1">Your Digital Bills & History</h3>
            {historyTokens.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500">No history found.</p>
              </div>
            ) : (
              historyTokens.map(token => {
                const farmerBill = token.v2_bills?.find((b:any) => b.bill_type === 'FARMER_J_BILL');
                return (
                  <div key={token.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{token.token_number}</p>
                        <p className="text-xs text-gray-500">{new Date(token.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">{token.status}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {token.crop_sub_lots?.map((lot: any) => (
                        <span key={lot.id} className="text-xs border px-2 py-1 rounded bg-gray-50">{lot.crop_name} ({lot.actual_weight || lot.estimated_weight}q)</span>
                      ))}
                    </div>

                    {farmerBill ? (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-green-700 flex items-center gap-1"><ReceiptText className="w-3 h-3"/> DIGITAL J-BILL</p>
                          <p className="text-xs text-green-600">#{farmerBill.bill_number}</p>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <div>
                            <p className="text-xs text-gray-600">Gross: Ã¢â€šÂ¹{farmerBill.gross_amount}</p>
                            <p className="text-xs text-gray-600">Fees: -Ã¢â€šÂ¹{farmerBill.total_fees}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-800 mb-0.5">Net Received</p>
                            <p className="font-bold text-green-700 text-lg leading-none">Ã¢â€šÂ¹{farmerBill.net_amount}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-700 border border-yellow-100 text-center">
                        {token.status === 'COMPLETED' ? 'Bill processing offline' : 'Bill not generated yet'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ===================== TAB: PROFILE ===================== */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-lg text-gray-800 mb-4 px-1">Farmer Profile (e-KYC)</h3>
            {profileData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-primary-50 p-6 flex flex-col items-center border-b border-primary-100 relative">
                  <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-green-200">
                    <CheckCircle2 className="w-3 h-3"/> Verified
                  </div>
                  {profileData.photo_url ? (
                    <img src={profileData.photo_url} alt="Profile" className="w-24 h-24 object-cover rounded-full shadow-md border-4 border-white mb-3" />
                  ) : (
                    <div className="w-24 h-24 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 mb-3 border-4 border-white shadow-sm">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900">{profileData.full_name}</h2>
                  <p className="text-primary-700 font-bold bg-white px-3 py-1 rounded-full mt-2 text-sm shadow-sm border border-primary-100">{profileData.farmer_uid}</p>
                </div>
                
                <div className="p-5 space-y-5">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="font-semibold text-gray-800 text-lg">+91 {profileData.phone_number}</p>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Aadhaar Card</p>
                    <p className="font-mono font-bold text-gray-800 text-lg tracking-widest">XXXX XXXX {profileData.aadhaar_hash.slice(-4)}</p>
                  </div>
                  
                  {profileData.dob && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date of Birth</p>
                      <p className="font-medium text-gray-800">{new Date(profileData.dob).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {profileData.address && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Registered Address</p>
                      <p className="font-medium text-gray-800 leading-relaxed">{profileData.address}</p>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Account Created</p>
                    <p className="font-medium text-gray-800">{new Date(profileData.created_at).toLocaleString()}</p>
                  </div>
                  
                  <div className="pt-6">
                    <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition shadow-sm">
                      <LogOut className="w-5 h-5" />
                      Secure Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around p-3 z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'home' ? 'text-primary-600' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'history' ? 'text-primary-600' : 'text-gray-400'}`}>
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold">History</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'profile' ? 'text-primary-600' : 'text-gray-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </div>
    </div>
  );
}