"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Search, CheckCircle, Clock, RotateCcw, AlertCircle, Weight } from 'lucide-react'

export default function DashboardPage() {
  const [tokenSearch, setTokenSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)
  const [lots, setLots] = useState<any[]>([])
  const [error, setError] = useState('')
  
  const [stats, setStats] = useState({ weighed: 0, waiting: 0 })
  const [recentWeighed, setRecentWeighed] = useState<any[]>([])
  
  const [actualWeights, setActualWeights] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const fetchStatsAndRecent = async () => {
    const today = new Date().toISOString().split('T')[0]
    
    // Stats
    const { count: weighedCount } = await supabase
      .from('crop_sub_lots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'WEIGHED')
      // simple today check might need created_at >= today depending on tz
    
    const { count: waitingCount } = await supabase
      .from('crop_sub_lots')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'AUCTIONED')
      
    setStats({ weighed: weighedCount || 0, waiting: waitingCount || 0 })
    
    // Recent
    const { data: recent } = await supabase
      .from('crop_sub_lots')
      .select('id, crop_name, actual_weight, created_at')
      .eq('status', 'WEIGHED')
      .order('created_at', { ascending: false })
      .limit(10)
      
    if (recent) setRecentWeighed(recent)
  }

  useEffect(() => {
    fetchStatsAndRecent()
    
    const channel = supabase.channel('weight-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crop_sub_lots' }, () => {
        fetchStatsAndRecent()
      })
      .subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [])
  
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!tokenSearch) return
    
    setLoading(true)
    setError('')
    setTokenData(null)
    setLots([])
    
    try {
      const { data: token, error: tokenErr } = await supabase
        .from('master_tokens')
        .select('*')
        .eq('token_number', tokenSearch)
        .single()
        
      if (tokenErr || !token) {
        setError('Token not found')
        setLoading(false)
        return
      }
      
      setTokenData(token)
      
      const { data: lotsData, error: lotsErr } = await supabase
        .from('crop_sub_lots')
        .select('*')
        .eq('master_token_id', token.id)
        .in('status', ['AUCTIONED', 'WEIGHED'])
        
      if (lotsErr) throw lotsErr
      
      setLots(lotsData || [])
    } catch (err: any) {
      setError(err.message || 'Error fetching token')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmWeight = async (lotId: string) => {
    const weight = parseFloat(actualWeights[lotId])
    if (!weight || weight <= 0) {
      setError('Please enter a valid weight')
      return
    }
    
    setUpdating(lotId)
    setError('')
    try {
      const { error: updErr } = await supabase
        .from('crop_sub_lots')
        .update({ actual_weight: weight, status: 'WEIGHED' })
        .eq('id', lotId)
        
      if (updErr) throw updErr
      
      showToast('Weight confirmed successfully!')
      
      // Update local state
      setLots(lots.map(l => l.id === lotId ? { ...l, actual_weight: weight, status: 'WEIGHED' } : l))
    } catch (err: any) {
      setError(err.message || 'Failed to update weight')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity">
          {toast}
        </div>
      )}

      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Enter Token Number (e.g. TKN-505)"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg uppercase"
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value.toUpperCase())}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </form>
          {error && <p className="mt-3 text-red-600 flex items-center gap-2"><AlertCircle size={16} />{error}</p>}
        </div>

        {/* Token Details */}
        {tokenData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{tokenData.token_number}</h3>
                <p className="text-sm text-gray-600">{tokenData.farmer_name} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Arrived: {new Date(tokenData.arrived_at).toLocaleTimeString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800`}>
                {tokenData.status}
              </span>
            </div>
            
            <div className="p-6">
              <h4 className="font-medium text-gray-900 mb-4">Auctioned & Weighed Lots</h4>
              {lots.length === 0 ? (
                <p className="text-gray-500 italic">No lots ready for weighing yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-3 text-sm font-semibold text-gray-600">Crop</th>
                        <th className="pb-3 text-sm font-semibold text-gray-600">Est. Qty</th>
                        <th className="pb-3 text-sm font-semibold text-gray-600">Rate (ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¹)</th>
                        <th className="pb-3 text-sm font-semibold text-gray-600">Actual Wt (Qtl)</th>
                        <th className="pb-3 text-sm font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.map((lot) => (
                        <tr key={lot.id} className={`border-b border-gray-100 last:border-0 ${lot.status === 'WEIGHED' ? 'bg-green-50/50' : ''}`}>
                          <td className="py-4 font-medium">{lot.crop_name}</td>
                          <td className="py-4">{lot.estimated_weight}</td>
                          <td className="py-4">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¹{lot.auction_rate}</td>
                          <td className="py-4">
                            {lot.status === 'WEIGHED' ? (
                              <span className="font-bold text-gray-900">{lot.actual_weight}</span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500"
                                value={actualWeights[lot.id] || ''}
                                onChange={(e) => setActualWeights({...actualWeights, [lot.id]: e.target.value})}
                                placeholder="0.00"
                              />
                            )}
                          </td>
                          <td className="py-4">
                            {lot.status === 'WEIGHED' ? (
                              <div className="flex items-center gap-1 text-green-600 font-medium">
                                <CheckCircle size={18} /> Done
                              </div>
                            ) : (
                              <button
                                onClick={() => handleConfirmWeight(lot.id)}
                                disabled={updating === lot.id}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                              >
                                {updating === lot.id ? 'Saving...' : 'Confirm'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">Today's Stats</h3>
            <button onClick={fetchStatsAndRecent} className="text-gray-400 hover:text-primary-600">
              <RotateCcw size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle size={20} />
                <span className="text-sm font-medium">Weighed</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.weighed}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <Clock size={20} />
                <span className="text-sm font-medium">Waiting</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{stats.waiting}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Weight size={20} className="text-primary-600" /> Recent Weighings
          </h3>
          <div className="space-y-4">
            {recentWeighed.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              recentWeighed.map((lot) => (
                <div key={lot.id} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900">{lot.crop_name}</p>
                    <p className="text-xs text-gray-500">{new Date(lot.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded">
                    {lot.actual_weight} Qtl
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
    </div>
  )
}
