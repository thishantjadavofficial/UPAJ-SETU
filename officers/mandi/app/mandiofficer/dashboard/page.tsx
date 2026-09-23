"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logout } from "../../../lib/auth";
import { generateSingleBillHtml } from '../../../components/BillPrint';

import { supabase } from "../../../lib/supabaseClient";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  LayoutDashboard, Settings, FileText, LogOut, Activity, IndianRupee, Receipt, AlertCircle, CheckCircle, Search
} from "lucide-react";

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#14532d'];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // KPIs & Analytics state
  const [kpis, setKpis] = useState({
    tradeVolume: 0,
    mandiCess: 0,
    farmerBills: 0,
    vepariInvoices: 0
  });
  const [dailyVolume, setDailyVolume] = useState<any[]>([]);
  const [feeBreakdown, setFeeBreakdown] = useState<any[]>([]);
  
  // Live Feed
  const [liveBills, setLiveBills] = useState<any[]>([]);

  // Fee Settings state
  const [fees, setFees] = useState({
    market_fee_percent: 0,
    farmer_unloading_fee_percent: 0,
    agent_commission_percent: 0,
    gst_percent: 0
  });
  const [savingFees, setSavingFees] = useState(false);
  const [toast, setToast] = useState('');

  // Tokens state
  const [tokens, setTokens] = useState<any[]>([]);
  const [tokenSearch, setTokenSearch] = useState('');
  const [tokenStatus, setTokenStatus] = useState('ALL');
  const [tokenPage, setTokenPage] = useState(1);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    if (!getSession('mandi')) {
      router.push('/mandiofficer');
      return;
    }
    loadData();
    const channel = subscribeToBills();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAnalytics(),
      fetchFees(),
      fetchTokens(1, '', 'ALL')
    ]);
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    const { data: bills, error } = await supabase.from('v2_bills').select('*');
    if (error || !bills) return;

    let tradeVolume = 0;
    let mandiCess = 0;
    let farmerBills = 0;
    let vepariInvoices = 0;
    
    let totalMarketFee = 0;
    let totalGST = 0;
    let totalUnloading = 0;
    let totalCommission = 0;

    const dailyMap: Record<string, number> = {};

    bills.forEach(b => {
      if (b.bill_type === 'FARMER_J_BILL') farmerBills++;
      if (b.bill_type === 'VEPARI_INVOICE') vepariInvoices++;
      
      const gross = Number(b.gross_amount || 0);
      tradeVolume += gross;

      if (b.fee_breakdown) {
        let feesData = typeof b.fee_breakdown === 'string' ? JSON.parse(b.fee_breakdown) : b.fee_breakdown;
        
        mandiCess += Number(feesData.market_fee || 0);
        totalMarketFee += Number(feesData.market_fee || 0);
        totalGST += Number(feesData.gst || 0);
        totalUnloading += Number(feesData.unloading_fee || 0);
        totalCommission += Number(feesData.commission || 0);
      }

      // Group by date (last 7 days logic simplified to just grouping existing dates)
      const date = new Date(b.created_at).toLocaleDateString();
      if (!dailyMap[date]) dailyMap[date] = 0;
      dailyMap[date] += gross;
    });

    setKpis({ tradeVolume, mandiCess, farmerBills, vepariInvoices });
    
    const chartData = Object.keys(dailyMap).slice(-7).map(date => ({
      date,
      volume: dailyMap[date]
    }));
    setDailyVolume(chartData);

    setFeeBreakdown([
      { name: 'Market Fee', value: totalMarketFee },
      { name: 'GST', value: totalGST },
      { name: 'Unloading', value: totalUnloading },
      { name: 'Commission', value: totalCommission }
    ]);
    
    // Set initial live feed
    setLiveBills(bills.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20));
  };

  const fetchFees = async () => {
    const { data } = await supabase.from('apmc_fees').select('*').eq('id', 1).single();
    if (data) {
      setFees({
        market_fee_percent: data.market_fee_percent,
        farmer_unloading_fee_percent: data.farmer_unloading_fee_percent,
        agent_commission_percent: data.agent_commission_percent,
        gst_percent: data.gst_percent
      });
    }
  };

  const fetchTokens = async (page: number, search: string, status: string) => {
    let query = supabase.from('master_tokens').select('*', { count: 'exact' });
    
    if (status !== 'ALL') query = query.eq('status', status);
    if (search) query = query.or(`token_number.ilike.%${search}%,farmer_name.ilike.%${search}%`);
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * 20, page * 20 - 1);

    if (!error && data) {
      setTokens(data);
      if (count !== null) setTotalTokens(count);
    }
  };

  const subscribeToBills = () => {
    return supabase.channel('bills_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'v2_bills' }, payload => {
        setLiveBills(prev => [payload.new, ...prev].slice(0, 20));
      })
      .subscribe();
  };

    const viewBill = async (bill: any) => {
    // Fetch full token data
    const { data: token } = await supabase
      .from('master_tokens')
      .select('*, crop_sub_lots(*, veparis(*))')
      .eq('id', bill.master_token_id)
      .single();

    if (!token) return alert('Token data not found');

    const type = bill.bill_type === 'FARMER_J_BILL' ? 'FARMER' : 'VEPARI';
    const vepari = token.crop_sub_lots[0]?.veparis;

    const billData = {
      token_number: token.token_number,
      farmer_name: token.farmer_name,
      farmer_uid: token.farmer_uid,
      vepari_name: vepari?.company_name || 'Multiple',
      vepari_gst: vepari?.gst_number || 'N/A',
      lots: token.crop_sub_lots,
      gross_amount: bill.gross_amount,
      fees,
      farmer_net: type === 'FARMER' ? bill.net_amount : 0,
      vepari_net: type === 'VEPARI' ? bill.net_amount : 0,
    };

    const html = generateSingleBillHtml(billData, type as any);
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  };

  const handleLogout = () => {
    logout('mandi');
    router.push('/mandiofficer');
  };

  const saveFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFees(true);
    const { error } = await supabase.from('apmc_fees').update(fees).eq('id', 1);
    setSavingFees(false);
    if (error) {
      showToast('Error saving fees: ' + error.message);
    } else {
      showToast('Fees updated successfully!');
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleTokenSearch = (e: any) => {
    setTokenSearch(e.target.value);
    setTokenPage(1);
    fetchTokens(1, e.target.value, tokenStatus);
  };

  const handleTokenStatus = (e: any) => {
    setTokenStatus(e.target.value);
    setTokenPage(1);
    fetchTokens(1, tokenSearch, e.target.value);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-primary-600">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <Activity className="text-primary-600 w-6 h-6" />
          <h1 className="font-bold text-xl text-gray-900">Mandi Officer</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'analytics' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('fees')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'fees' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5" /> Fee Settings
          </button>
          <button 
            onClick={() => setActiveTab('tokens')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'tokens' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" /> Tokens Registry
          </button>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition mt-auto">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto h-screen">
        {toast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary-400" /> {toast}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-6xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm font-medium mb-1">Total Trade Volume</div>
                <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" /> {kpis.tradeVolume.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm font-medium mb-1">Total Mandi Cess</div>
                <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  <IndianRupee className="w-5 h-5" /> {kpis.mandiCess.toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm font-medium mb-1">Farmer Bills</div>
                <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  <Receipt className="w-5 h-5" /> {kpis.farmerBills}
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-sm font-medium mb-1">Vepari Invoices</div>
                <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  <Receipt className="w-5 h-5" /> {kpis.vepariInvoices}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Trade Volume (Last 7 Active Days)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyVolume}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rs ${val/1000}k`} />
                      <Tooltip formatter={(val: number) => [`Rs ${val.toLocaleString()}`, 'Volume']} />
                      <Bar dataKey="volume" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Fee Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feeBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {feeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `Rs ${val.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Feed */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Bills Feed
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {liveBills.map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 text-xs font-bold rounded ${bill.bill_type === 'FARMER_J_BILL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {bill.bill_type === 'FARMER_J_BILL' ? 'FARMER' : 'VEPARI'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{bill.bill_number}</div>
                        <div className="text-xs text-gray-500">{new Date(bill.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900">Rs {Number(bill.net_amount).toLocaleString()}</div>
                      <div className="flex-shrink-0"><button onClick={() => viewBill(bill)} className="ml-4 text-xs bg-primary-600 text-white hover:bg-primary-700 px-3 py-1.5 rounded font-medium shadow-sm transition">View Format</button></div>
                  </div>
                ))}
                {liveBills.length === 0 && <div className="text-gray-500 text-sm py-4">No recent bills found.</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">APMC Fee Settings</h2>
            
            <form onSubmit={saveFees} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Fee (%)</label>
                  <input
                    type="number" step="0.01" required
                    value={fees.market_fee_percent}
                    onChange={(e) => setFees({...fees, market_fee_percent: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                  <input
                    type="number" step="0.01" required
                    value={fees.gst_percent}
                    onChange={(e) => setFees({...fees, gst_percent: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Unloading Fee (%)</label>
                  <input
                    type="number" step="0.01" required
                    value={fees.farmer_unloading_fee_percent}
                    onChange={(e) => setFees({...fees, farmer_unloading_fee_percent: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Commission (%)</label>
                  <input
                    type="number" step="0.01" required
                    value={fees.agent_commission_percent}
                    onChange={(e) => setFees({...fees, agent_commission_percent: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-primary-800">Preview: Example Rs 1,000 Gross Trade</h4>
                  <p className="text-sm text-primary-700 mt-1">
                    Farmer gets: Rs {(1000 - (1000 * (fees.farmer_unloading_fee_percent + fees.agent_commission_percent) / 100)).toFixed(2)}<br/>
                    Vepari pays: Rs {(1000 + (1000 * (fees.market_fee_percent + fees.gst_percent) / 100)).toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                type="submit" disabled={savingFees}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50"
              >
                {savingFees ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Master Token Registry</h2>
            
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text" placeholder="Search token # or farmer..."
                    value={tokenSearch} onChange={handleTokenSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <select
                  value={tokenStatus} onChange={handleTokenStatus}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="BOOKED">BOOKED</option>
                  <option value="ARRIVED">ARRIVED</option>
                  <option value="CLEARED">CLEARED</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-sm text-gray-500">
                      <th className="py-3 font-medium">Token #</th>
                      <th className="py-3 font-medium">Farmer</th>
                      <th className="py-3 font-medium">Type</th>
                      <th className="py-3 font-medium">Status</th>
                      <th className="py-3 font-medium">Created</th>
                      <th className="py-3 font-medium">Arrived At</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {tokens.map(t => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{t.token_number}</td>
                        <td className="py-3">{t.farmer_name} <span className="text-xs text-gray-400">({t.farmer_uid})</span></td>
                        <td className="py-3">
                          {t.is_walk_in ? 
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Walk-in</span> : 
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Pre-booked</span>
                          }
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${t.status==='CLEARED'?'bg-green-100 text-green-700':t.status==='ARRIVED'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                        <td className="py-3 text-gray-500">{t.arrived_at ? new Date(t.arrived_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                    {tokens.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-gray-500">No tokens found.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">Showing {tokens.length} of {totalTokens}</div>
                <div className="flex gap-2">
                  <button
                    disabled={tokenPage === 1}
                    onClick={() => { setTokenPage(p=>p-1); fetchTokens(tokenPage-1, tokenSearch, tokenStatus); }}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    disabled={tokenPage * 20 >= totalTokens}
                    onClick={() => { setTokenPage(p=>p+1); fetchTokens(tokenPage+1, tokenSearch, tokenStatus); }}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}