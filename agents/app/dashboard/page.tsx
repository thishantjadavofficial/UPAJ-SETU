"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, logout } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { generateCombinedBillsHtml } from '@/components/BillPrint';
import { LogOut, Search, Plus, Trash2, RefreshCw, Users, Gavel, Receipt, LayoutDashboard, History, UserPlus } from 'lucide-react';

// ======================= TAB 1: WALK-IN =======================
function WalkinTab() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [crops, setCrops] = useState([{ name: 'Wheat', weight: '' }]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const CROP_OPTIONS = ['Wheat','Rice','Mustard','Cotton','Sugarcane','Maize','Soybean','Bajra','Jowar','Chana'];

  const addCrop = () => setCrops([...crops, { name: 'Wheat', weight: '' }]);
  const removeCrop = (i: number) => setCrops(crops.filter((_, idx) => idx !== i));
  const updateCrop = (i: number, field: string, value: string) => {
    const c = [...crops]; c[i] = { ...c[i], [field]: value }; setCrops(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setStatus('');
    try {
      const farmer_uid = 'WI-' + Date.now().toString().slice(-4);
      const token_number = 'TKN-' + Date.now().toString().slice(-4);

      const { error: uErr } = await supabase.from('users').insert({
        full_name: name, phone_number: phone,
        aadhaar_hash: 'walkin_' + phone, role: 'FARMER', farmer_uid
      });
      if (uErr && !uErr.message.includes('duplicate')) throw uErr;

      const { data: mToken, error: mErr } = await supabase.from('master_tokens').insert({
        token_number, farmer_uid, farmer_name: name,
        is_walk_in: true, status: 'ARRIVED', arrived_at: new Date().toISOString()
      }).select().single();
      if (mErr) throw mErr;

      const lots = crops.map((c, i) => ({
        sub_id: `${token_number}_${c.name.toUpperCase()}_${i}`,
        master_token_id: mToken.id,
        crop_name: c.name,
        estimated_weight: parseFloat(c.weight) || 0,
        status: 'PENDING'
      }));
      await supabase.from('crop_sub_lots').insert(lots);

      setStatus(`Success! Registered Token: ${token_number} | Farmer UID: ${farmer_uid}`);
      setName(''); setPhone(''); setAadhaar(''); setCrops([{ name: 'Wheat', weight: '' }]);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-primary-600"/>Walk-in Registration</h2>
      {status && <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${status.startsWith('Success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{status}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Farmer Name *</label>
            <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="e.g. Ram Kumar" required value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
            <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Any phone number" required value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aadhaar (sample)</label>
            <input className="w-full border rounded-lg p-2.5 text-sm" placeholder="Any Aadhaar number" value={aadhaar} onChange={e=>setAadhaar(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm text-gray-700">Crops Being Brought</h3>
            <button type="button" onClick={addCrop} className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline"><Plus className="w-4 h-4"/>Add Crop</button>
          </div>
          <div className="space-y-2">
            {crops.map((crop, i) => (
              <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg">
                <select className="flex-1 border rounded p-2 text-sm" value={crop.name} onChange={e=>updateCrop(i,'name',e.target.value)}>
                  {CROP_OPTIONS.map(c=><option key={c}>{c}</option>)}
                </select>
                <input type="number" className="w-28 border rounded p-2 text-sm" placeholder="Est. Weight (q)" value={crop.weight} onChange={e=>updateCrop(i,'weight',e.target.value)} />
                {crops.length > 1 && <button type="button" onClick={()=>removeCrop(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:bg-primary-700 transition">
          {loading ? 'Registering...' : 'Register Walk-in Farmer'}
        </button>
      </form>
    </div>
  );
}

// ======================= TAB 2: LIVE BOOKINGS =======================
function LiveBookingsTab() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const STATUS_COLORS: any = {
    BOOKED: 'bg-blue-100 text-blue-700',
    ARRIVED: 'bg-yellow-100 text-yellow-700',
    AUCTIONED: 'bg-orange-100 text-orange-700',
    WEIGHED: 'bg-purple-100 text-purple-700',
    BILLED: 'bg-green-100 text-green-700',
    UNSOLD: 'bg-gray-100 text-gray-600',
  };

  const loadTokens = useCallback(async () => {
    setLoading(true);
    const today = new Date(); today.setHours(0,0,0,0);
    const { data } = await supabase
      .from('master_tokens')
      .select('*, crop_sub_lots(*)')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    if (data) setTokens(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const filtered = filter === 'ALL' ? tokens : tokens.filter(t => t.status === filter);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-primary-600"/>Live Bookings - Today</h2>
        <div className="flex items-center gap-2">
          <select className="border rounded-lg px-3 py-1.5 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="ARRIVED">Arrived</option>
            <option value="BILLED">Billed</option>
          </select>
          <button onClick={loadTokens} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"><RefreshCw className="w-4 h-4"/>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">No bookings found for today.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((token: any) => (
            <div key={token.id} className="border rounded-xl p-4 hover:border-primary-200 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{token.token_number}</span>
                    {token.is_walk_in && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Walk-in</span>}
                  </div>
                  <p className="text-sm text-gray-600">{token.farmer_name} - UID: {token.farmer_uid}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Booked: {new Date(token.created_at).toLocaleTimeString()}
                    {token.arrived_at && ` - Arrived: ${new Date(token.arrived_at).toLocaleTimeString()}`}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[token.status] || 'bg-gray-100'}`}>{token.status}</span>
              </div>
              {token.crop_sub_lots?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {token.crop_sub_lots.map((lot: any) => (
                    <span key={lot.id} className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[lot.status] || 'bg-gray-50 text-gray-600'}`}>
                      {lot.crop_name} - {lot.estimated_weight}q - {lot.status}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================= TAB 3: AUCTION =======================
function AuctionTab() {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenData, setTokenData] = useState<any>(null);
  const [veparis, setVeparis] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  // Add Vepari State
  const [showAddVepari, setShowAddVepari] = useState(false);
  const [newVepariName, setNewVepariName] = useState('');
  const [newVepariPhone, setNewVepariPhone] = useState('');
  const [newVepariGst, setNewVepariGst] = useState('');

  const loadVeparis = useCallback(async () => {
    const { data } = await supabase.from('veparis').select('*');
    if (data) setVeparis(data);
  }, []);

  useEffect(() => { loadVeparis(); }, [loadVeparis]);

  const searchToken = async () => {
    setStatus('Searching...');
    const { data, error } = await supabase.from('master_tokens').select('*, crop_sub_lots(*)').eq('token_number', tokenInput.trim().toUpperCase()).single();
    if (error || !data) { setStatus('Token not found.'); setTokenData(null); return; }
    setTokenData({ ...data, lots: data.crop_sub_lots });
    setStatus('');
  };

  const assignDeal = async (lotId: string, vepariId: string, rate: number) => {
    if (vepariId === 'ADD_NEW') {
      setShowAddVepari(true);
      return;
    }
    await supabase.from('crop_sub_lots').update({ vepari_id: vepariId, auction_rate: rate, status: 'AUCTIONED' }).eq('id', lotId);
    searchToken();
  };

  const markUnsold = async (lotId: string) => {
    await supabase.from('crop_sub_lots').update({ status: 'UNSOLD' }).eq('id', lotId);
    searchToken();
  };

  const handleSaveVepari = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newVepariName) return;
    const { error } = await supabase.from('veparis').insert({ company_name: newVepariName, phone: newVepariPhone, gst_number: newVepariGst || 'N/A' });
    if (error) { alert(error.message); return; }
    setNewVepariName(''); setNewVepariPhone(''); setNewVepariGst('');
    setShowAddVepari(false);
    loadVeparis();
    alert('New Vepari Saved Successfully!');
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Gavel className="w-5 h-5 text-primary-600"/>Auction Management</h2>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 border rounded-lg p-2.5 text-sm font-mono" placeholder="Enter Token Number (e.g. TKN-4968)" value={tokenInput} onChange={e=>setTokenInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchToken()} />
        <button onClick={searchToken} className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-gray-700 transition"><Search className="w-4 h-4"/>Load</button>
      </div>
      {status && <p className="text-sm text-gray-500 mb-4">{status}</p>}

      {showAddVepari && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><UserPlus className="w-4 h-4"/>Add New Vepari</h3>
          <form onSubmit={handleSaveVepari} className="flex gap-2 items-center">
            <input required placeholder="Company / Name" className="border p-2 rounded flex-1 text-sm" value={newVepariName} onChange={e=>setNewVepariName(e.target.value)}/>
            <input required placeholder="Phone Number" className="border p-2 rounded flex-1 text-sm" value={newVepariPhone} onChange={e=>setNewVepariPhone(e.target.value)}/>
            <input placeholder="GST (Optional)" className="border p-2 rounded flex-1 text-sm" value={newVepariGst} onChange={e=>setNewVepariGst(e.target.value)}/>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Save Vepari</button>
            <button type="button" onClick={()=>setShowAddVepari(false)} className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm">Cancel</button>
          </form>
        </div>
      )}

      {tokenData && (
        <div>
          <div className="bg-gray-50 border rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-lg">{tokenData.token_number}</p>
                <p className="text-sm text-gray-600">{tokenData.farmer_name} - {tokenData.farmer_uid}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${tokenData.status==='ARRIVED'?'bg-yellow-100 text-yellow-700':'bg-blue-100 text-blue-700'}`}>{tokenData.status}</span>
            </div>
          </div>

          <div className="space-y-3">
            {tokenData.lots.map((lot: any) => (
              <div key={lot.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{lot.crop_name} <span className="text-xs text-gray-400 font-normal">({lot.sub_id})</span></p>
                    <p className="text-sm text-gray-500">Est. Weight: {lot.estimated_weight} quintals</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${lot.status==='AUCTIONED'?'bg-green-100 text-green-700':lot.status==='UNSOLD'?'bg-gray-100 text-gray-500':lot.status==='PENDING'?'bg-yellow-100 text-yellow-700':'bg-blue-100 text-blue-700'}`}>{lot.status}</span>
                </div>

                {lot.status === 'PENDING' && (
                  <form className="mt-3 flex flex-wrap gap-2 items-center" onSubmit={(e:any)=>{e.preventDefault();assignDeal(lot.id,e.target.vepari.value,parseFloat(e.target.rate.value));}}>
                    <select name="vepari" required className="border rounded-lg p-2 text-sm flex-1 min-w-0" onChange={(e)=>{if(e.target.value==='ADD_NEW') setShowAddVepari(true)}}>
                      <option value="">Select Buyer (Vepari)</option>
                      {veparis.map(v=><option key={v.id} value={v.id}>{v.company_name}</option>)}
                      <option value="ADD_NEW" className="font-bold text-primary-600">+ Add New Vepari</option>
                    </select>
                    <input name="rate" type="number" required placeholder="Rate (Rs/q)" className="border rounded-lg p-2 text-sm w-36" />
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Assign Deal</button>
                    <button type="button" onClick={()=>markUnsold(lot.id)} className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600">Mark Unsold</button>
                  </form>
                )}
                {lot.status === 'AUCTIONED' && (
                  <p className="mt-2 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                    Done: Rs {lot.auction_rate}/q -> {veparis.find(v=>v.id===lot.vepari_id)?.company_name || 'Buyer'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ======================= TAB 4: BILLING =======================
function BillingTab() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [fees, setFees] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [lotsRes, feesRes] = await Promise.all([
      supabase.from('crop_sub_lots').select('*, master_tokens(*), veparis(*)').eq('status', 'WEIGHED'),
      supabase.from('apmc_fees').select('*').eq('id', 1).single()
    ]);
    if (feesRes.data) setFees(feesRes.data);

    if (lotsRes.data) {
      const grouped = lotsRes.data.reduce((acc: any, lot: any) => {
        const mt = lot.master_tokens;
        if (!acc[mt.id]) acc[mt.id] = { ...mt, lots: [] };
        // Attach vepari details to lot for easy access
        lot.vepari_name = lot.veparis?.company_name;
        lot.vepari_gst = lot.veparis?.gst_number;
        acc[mt.id].lots.push(lot);
        return acc;
      }, {});
      setTokens(Object.values(grouped));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generateBills = async (tokenData: any) => {
    if (!fees) return alert('Fee settings not loaded.');

    let farmerGross = 0;
    tokenData.lots.forEach((lot: any) => { farmerGross += lot.actual_weight * lot.auction_rate; });

    const unloadingAmt = farmerGross * fees.farmer_unloading_fee_percent / 100;
    const commissionAmt = farmerGross * fees.agent_commission_percent / 100;
    const farmerNet = farmerGross - unloadingAmt - commissionAmt;
    const vepariNet = farmerGross + (farmerGross * fees.market_fee_percent / 100) + (farmerGross * fees.gst_percent / 100);

    const html = generateCombinedBillsHtml({
      token_number: tokenData.token_number,
      farmer_name: tokenData.farmer_name,
      farmer_uid: tokenData.farmer_uid,
      lots: tokenData.lots,
      fees,
      gross_amount: farmerGross,
      farmer_net: farmerNet,
      vepari_net: vepariNet,
      vepari_name: tokenData.lots[0]?.vepari_name,
      vepari_gst: tokenData.lots[0]?.vepari_gst,
    });

    const fWin = window.open('', '_blank');
    fWin?.document.write(html); 
    fWin?.document.close(); 
    setTimeout(() => {
      fWin?.print();
    }, 500);

        // Insert into v2_bills for Mandi & Farmer portals
    try {
      const billInserts = [];
      const bill_num_base = 'B-' + Date.now().toString().slice(-6);
      
      // 1. Farmer Bill
      billInserts.push({
        bill_number: bill_num_base + '-F',
        bill_type: 'FARMER_J_BILL',
        master_token_id: tokenData.id,
        gross_amount: farmerGross,
        total_fees: unloadingAmt + commissionAmt,
        net_amount: farmerNet,
        fee_breakdown: { unloading: unloadingAmt, commission: commissionAmt }
      });
      
      // 2. Vepari Bill (assuming 1 buyer for simplicity here)
      billInserts.push({
        bill_number: bill_num_base + '-V',
        bill_type: 'VEPARI_INVOICE',
        master_token_id: tokenData.id,
        gross_amount: farmerGross,
        total_fees: (farmerGross * fees.market_fee_percent / 100) + (farmerGross * fees.gst_percent / 100),
        net_amount: vepariNet,
        fee_breakdown: { market_fee: (farmerGross * fees.market_fee_percent / 100), gst: (farmerGross * fees.gst_percent / 100) }
      });
      
      await supabase.from('v2_bills').insert(billInserts);
    } catch (e) {
      console.error('Failed to save to v2_bills', e);
    }

    // Mark all lots as BILLED
    for (const lot of tokenData.lots) {
      await supabase.from('crop_sub_lots').update({ status: 'BILLED' }).eq('id', lot.id);
    }
    // Mark master token as BILLED
    await supabase.from('master_tokens').update({ status: 'BILLED' }).eq('id', tokenData.id);
    loadData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Receipt className="w-5 h-5 text-primary-600"/>Billing Engine</h2>
        <button onClick={loadData} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>

      {fees && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 grid grid-cols-4 gap-2 text-center">
          <div><p className="font-bold">{fees.market_fee_percent}%</p><p className="text-xs text-blue-500">Market Fee</p></div>
          <div><p className="font-bold">{fees.farmer_unloading_fee_percent}%</p><p className="text-xs text-blue-500">Unloading</p></div>
          <div><p className="font-bold">{fees.agent_commission_percent}%</p><p className="text-xs text-blue-500">Commission</p></div>
          <div><p className="font-bold">{fees.gst_percent}%</p><p className="text-xs text-blue-500">GST</p></div>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div>
       : tokens.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30"/>
          No tokens ready for billing.<br/><span className="text-xs">All crop lots must be WEIGHED first.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token: any) => {
            return (
              <div key={token.id} className="border rounded-xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-xl">{token.token_number}</p>
                    <p className="text-sm text-gray-600">{token.farmer_name}</p>
                  </div>
                  <button onClick={()=>generateBills(token)} className="bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition flex items-center gap-2">
                    <Receipt className="w-4 h-4"/>Generate All 4 Bills
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left p-2 pl-3">Crop</th>
                        <th className="text-right p-2">Actual Wt</th>
                        <th className="text-right p-2">Rate</th>
                        <th className="text-right p-2 pr-3">Gross</th>
                      </tr>
                    </thead>
                    <tbody>
                      {token.lots.map((lot: any) => (
                        <tr key={lot.id} className="border-t">
                          <td className="p-2 pl-3 font-medium">{lot.crop_name}</td>
                          <td className="p-2 text-right text-gray-600">{lot.actual_weight} q</td>
                          <td className="p-2 text-right text-gray-600">Rs {lot.auction_rate}/q</td>
                          <td className="p-2 pr-3 text-right font-medium">Rs {(lot.actual_weight*lot.auction_rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ======================= TAB 5: HISTORY =======================
function HistoryTab() {
  const [historyTokens, setHistoryTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<any>(null);

  const loadHistory = async () => {
    setLoading(true);
    
    const [tokensRes, feesRes] = await Promise.all([
      supabase
        .from('master_tokens')
        .select('*, crop_sub_lots(*, veparis(*)), v2_bills(*)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('apmc_fees').select('*').eq('id', 1).single()
    ]);

    if (tokensRes.data) setHistoryTokens(tokensRes.data);
    if (feesRes.data) setFees(feesRes.data);
    
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const viewBills = (token: any) => {
    if (!fees) return alert('Fees loading...');
    
    let farmerGross = 0;
    token.crop_sub_lots.forEach((lot: any) => { 
      farmerGross += (lot.actual_weight || lot.estimated_weight) * (lot.auction_rate || 0); 
    });

    const unloadingAmt = farmerGross * fees.farmer_unloading_fee_percent / 100;
    const commissionAmt = farmerGross * fees.agent_commission_percent / 100;
    const farmerNet = farmerGross - unloadingAmt - commissionAmt;
    const vepariNet = farmerGross + (farmerGross * fees.market_fee_percent / 100) + (farmerGross * fees.gst_percent / 100);
    
    const html = generateCombinedBillsHtml({
      token_number: token.token_number,
      farmer_name: token.farmer_name,
      farmer_uid: token.farmer_uid,
      lots: token.crop_sub_lots.map((l:any) => ({...l, vepari_name: l.veparis?.company_name, vepari_gst: l.veparis?.gst_number})),
      fees,
      gross_amount: farmerGross,
      farmer_net: farmerNet,
      vepari_net: vepariNet
    });

    const fWin = window.open('', '_blank');
    fWin?.document.write(html); 
    fWin?.document.close(); 
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><History className="w-5 h-5 text-primary-600"/>Agent Ledger & History</h2>
        <button onClick={loadHistory} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"><RefreshCw className="w-4 h-4"/>Refresh</button>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : historyTokens.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">No history found.</div>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Token Number</th>
                <th className="p-4">Farmer Name</th>
                <th className="p-4">Total Lots</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {historyTokens.map(token => (
                <tr key={token.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(token.created_at).toLocaleString()}</td>
                  <td className="p-4 font-bold text-gray-800">{token.token_number}</td>
                  <td className="p-4 font-medium">{token.farmer_name} <span className="text-xs text-gray-400 font-normal">({token.farmer_uid})</span></td>
                  <td className="p-4 text-gray-600">{token.crop_sub_lots?.length || 0} crops</td>
                  <td className="p-4">
                    <span className={"px-2 py-1 rounded text-xs font-bold " + (token.status === 'BILLED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')}>{token.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    {token.status === 'BILLED' ? (
                      <button onClick={() => viewBills(token)} className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition">
                        View Detailed Bills
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not billed yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// ======================= MAIN PAGE =======================
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'walkin' | 'bookings' | 'auction' | 'billing' | 'history'>('bookings');
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) router.push('/');
  }, [router]);

  const tabs = [
    { id: 'bookings', label: 'Live Bookings', icon: LayoutDashboard },
    { id: 'walkin', label: 'Walk-in', icon: Users },
    { id: 'auction', label: 'Auction', icon: Gavel },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-700">Agent Portal - UPAJ SETU V2</h1>
        <button onClick={()=>{ logout(); router.push('/'); }} className="flex items-center text-gray-500 hover:text-red-600 text-sm gap-1">
          <LogOut className="w-4 h-4"/>Logout
        </button>
      </header>

      <div className="container mx-auto px-4 py-6 flex-1 max-w-6xl">
        <div className="flex space-x-1 mb-6 bg-white p-1.5 rounded-xl shadow-sm overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)}
                className={"flex-1 whitespace-nowrap py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition " + (activeTab===tab.id ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100')}
              >
                <Icon className="w-4 h-4"/>{tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {activeTab === 'bookings' && <LiveBookingsTab />}
          {activeTab === 'walkin' && <WalkinTab />}
          {activeTab === 'auction' && <AuctionTab />}
          {activeTab === 'billing' && <BillingTab />}
          {activeTab === 'history' && <HistoryTab />}
        </div>
      </div>
    </div>
  );
}
