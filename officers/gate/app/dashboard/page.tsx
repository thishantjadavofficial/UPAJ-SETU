"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Html5Qrcode } from 'html5-qrcode';
import { getSession, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Scan, Search, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ arrived: 0, booked: 0 });
  const [cameraActive, setCameraActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [liveArrivals, setLiveArrivals] = useState<any[]>([]);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string}|null>(null);
  
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!getSession()) {
      router.push('/');
      return;
    }
    fetchStats();
    fetchLiveFeed();

    const channel = supabase.channel('tokens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_tokens' }, () => {
        fetchStats();
        fetchLiveFeed();
      }).subscribe();
      
    return () => { 
      supabase.removeChannel(channel); 
      if (scannerRef.current && cameraActive) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('master_tokens').select('status, created_at');
    if (data) {
      const todayTokens = data.filter(t => t.created_at.startsWith(today));
      setStats({
        arrived: todayTokens.filter(t => t.status === 'ARRIVED').length,
        booked: todayTokens.filter(t => t.status === 'BOOKED').length,
      });
    }
  };

  const fetchLiveFeed = async () => {
    const { data } = await supabase.from('master_tokens')
      .select('*')
      .eq('status', 'ARRIVED')
      .order('arrived_at', { ascending: false })
      .limit(10);
    if (data) setLiveArrivals(data);
  };

  const startCamera = async () => {
    if (cameraActive) return;
    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          try {
            const parsed = JSON.parse(decodedText);
            if (parsed.uid) {
              stopCamera();
              handleArrival(parsed.uid);
            }
          } catch(e) { 
            console.error('Invalid QR format', decodedText); 
            // Fallback for raw UID scanning if not JSON
            if (decodedText.startsWith('F-')) {
               stopCamera();
               handleArrival(decodedText);
            }
          }
        },
        () => {} // suppress continuous warnings
      );
      setCameraActive(true);
      setMessage(null);
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Failed to start camera. Please check permissions.' });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && cameraActive) {
      try {
        await scannerRef.current.stop();
        setCameraActive(false);
      } catch (e) {
        console.error("Failed to stop camera", e);
      }
    }
  };

  const handleArrival = async (uid: string) => {
    const { data, error } = await supabase.from('master_tokens')
      .select('*')
      .eq('farmer_uid', uid)
      .eq('status', 'BOOKED')
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setSearchResult(data[0]);
      setMessage(null);
    } else {
      // Check if already arrived
      const { data: arrData } = await supabase.from('master_tokens')
        .select('*')
        .eq('farmer_uid', uid)
        .eq('status', 'ARRIVED')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (arrData && arrData.length > 0) {
        setMessage({ type: 'error', text: `Farmer ${uid} is already checked in.` });
      } else {
        setMessage({ type: 'error', text: `No BOOKED token found for farmer ${uid}` });
      }
      setSearchResult(null);
    }
  };

  const manualSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // First try BOOKED tokens
    let { data, error } = await supabase.from('master_tokens')
      .select('*')
      .or(`farmer_uid.eq.${searchQuery},token_number.eq.${searchQuery}`)
      .eq('status', 'BOOKED')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      setSearchResult(data[0]);
      setMessage(null);
    } else {
      // Check if it exists with other status
      let { data: otherData } = await supabase.from('master_tokens')
        .select('*')
        .or(`farmer_uid.eq.${searchQuery},token_number.eq.${searchQuery}`)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (otherData && otherData.length > 0) {
        setSearchResult(otherData[0]);
        if (otherData[0].status === 'ARRIVED') {
           setMessage({ type: 'error', text: 'Farmer already checked in.' });
        }
      } else {
        setMessage({ type: 'error', text: 'No token found with given UID or Token No.' });
        setSearchResult(null);
      }
    }
  };

  const markArrived = async (id: string) => {
    const { error } = await supabase.from('master_tokens')
      .update({ status: 'ARRIVED', arrived_at: new Date().toISOString() })
      .eq('id', id);
      
    if (!error) {
      setMessage({ type: 'success', text: 'Successfully marked as arrived!' });
      setSearchResult({...searchResult, status: 'ARRIVED'});
      // Reset search after 3 seconds
      setTimeout(() => setSearchResult(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to update token status.' });
    }
  };

  const handleLogout = () => {
    stopCamera();
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-primary-700">Gate Officer Portal</h1>
            <p className="text-sm text-gray-500">UPAJ SETU V2</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 font-medium bg-gray-100 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-md shadow-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="text-gray-500 font-medium mb-1">Today's Booked</h3>
            <p className="text-4xl font-bold text-blue-600">{stats.booked}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h3 className="text-gray-500 font-medium mb-1">Today's Arrived</h3>
            <p className="text-4xl font-bold text-primary-600">{stats.arrived}</p>
          </div>
        </div>

        {/* Main Action Area */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scanner */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Scan className="text-primary-600" /> QR Scanner
            </h2>
            <div 
              id="reader" 
              className="w-full h-64 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300"
            >
              {!cameraActive && <p className="text-gray-400">Camera is off</p>}
            </div>
            <div className="mt-4 flex gap-3">
              {!cameraActive ? (
                <button onClick={startCamera} className="flex-1 bg-primary-600 text-white py-2.5 rounded-md hover:bg-primary-700 font-medium transition-colors">
                  Start Scanner
                </button>
              ) : (
                <button onClick={stopCamera} className="flex-1 bg-red-600 text-white py-2.5 rounded-md hover:bg-red-700 font-medium transition-colors">
                  Stop Scanner
                </button>
              )}
            </div>
          </div>

          {/* Manual Search & Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              <Search className="text-primary-600" /> Manual Search
            </h2>
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                placeholder="Farmer UID (F-XXXX) or Token No." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && manualSearch()}
                className="flex-1 border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-primary-500 outline-none" 
              />
              <button 
                onClick={manualSearch} 
                className="bg-gray-800 text-white p-2.5 rounded-md px-6 hover:bg-gray-900 font-medium transition-colors"
              >
                Search
              </button>
            </div>

            {/* Search Result Card */}
            <div className="flex-1">
              {searchResult ? (
                <div className="border border-gray-200 p-5 rounded-lg bg-gray-50 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-xl text-gray-800">{searchResult.farmer_name}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${searchResult.status === 'BOOKED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {searchResult.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-6">
                      <p className="text-gray-600"><span className="font-medium text-gray-700">Farmer UID:</span> {searchResult.farmer_uid}</p>
                      <p className="text-gray-600"><span className="font-medium text-gray-700">Token No:</span> {searchResult.token_number}</p>
                      <p className="text-gray-500 text-sm mt-2">Booked at: {new Date(searchResult.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {searchResult.status === 'BOOKED' ? (
                    <button 
                      onClick={() => markArrived(searchResult.id)} 
                      className="w-full bg-green-600 text-white p-3 rounded-md flex items-center justify-center gap-2 hover:bg-green-700 font-medium transition-colors shadow-sm"
                    >
                      <CheckCircle size={20} /> Mark As Arrived
                    </button>
                  ) : (
                    <div className="text-center p-3 bg-gray-200 text-gray-600 rounded-md font-medium">
                      Already Marked Arrived
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50/50">
                  <p className="text-gray-400 text-center px-4">Search or scan a QR code to view token details and mark arrival.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Live Arrivals Feed
          </h2>
          <div className="space-y-3">
            {liveArrivals.map((arrival) => (
              <div key={arrival.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-md border-l-4 border-primary-500 shadow-sm">
                <div>
                  <p className="font-bold text-gray-800">{arrival.farmer_name} <span className="text-sm font-normal text-gray-500">({arrival.farmer_uid})</span></p>
                  <p className="text-sm text-primary-700 font-medium">{arrival.token_number}</p>
                </div>
                <div className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                  {new Date(arrival.arrived_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
            {liveArrivals.length === 0 && (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
                <p>No arrivals recorded yet today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
