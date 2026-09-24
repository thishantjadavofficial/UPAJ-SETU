'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Leaf } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getSession } from '../../lib/auth';
import Image from 'next/image';

const CROPS = [
  { id: 'wheat', name: 'Wheat', hi: '', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop' },
  { id: 'rice', name: 'Rice', hi: '', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
  { id: 'mustard', name: 'Mustard', hi: '', img: 'https://images.unsplash.com/photo-1627918542718-d748da3c0fb2?w=200&h=200&fit=crop' },
  { id: 'cotton', name: 'Cotton', hi: '', img: 'https://images.unsplash.com/photo-1595181971714-d576a804797f?w=200&h=200&fit=crop' },
  { id: 'sugarcane', name: 'Sugarcane', hi: '', img: 'https://images.unsplash.com/photo-1598463993874-91cfa9a9307d?w=200&h=200&fit=crop' },
  { id: 'maize', name: 'Maize', hi: '', img: 'https://images.unsplash.com/photo-1620021590487-738b5fa2f939?w=200&h=200&fit=crop' },
  { id: 'soybean', name: 'Soybean', hi: '', img: 'https://images.unsplash.com/photo-1604542031651-5349547d2165?w=200&h=200&fit=crop' },
  { id: 'bajra', name: 'Bajra', hi: '', img: 'https://images.unsplash.com/photo-1588691522079-50fa9e7b2123?w=200&h=200&fit=crop' },
];

export default function BookSlot() {
  const router = useRouter();
  const [session, setSessionData] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [selectedCrops, setSelectedCrops] = useState<{name: string, weight: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) router.push('/');
    else setSessionData(s);
  }, [router]);

  const today = new Date();
  today.setHours(0,0,0,0);
  const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const startDayOfWeek = today.getDay();
  const emptyDays = Array.from({length: startDayOfWeek}, () => null);
  
  const dates = Array.from({length: 14}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  const generateDayTraffic = (d: Date) => {
    const seed = d.getDate() * 50;
    const rand = (seed * 1103515245 + 12345) % 100;
    if (rand > 75) return { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', traffic: 'High', eta: '45m+' };
    if (rand > 40) return { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', traffic: 'Med', eta: '25m' };
    return { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', traffic: 'Low', eta: '10m' };
  };

  
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    for (let i = 7; i < 17; i++) {
      const start = new Date(date);
      start.setHours(i, 0, 0, 0);
      const end = new Date(date);
      end.setHours(i + 1, 0, 0, 0);
      
      const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const label = formatTime(start) + ' - ' + formatTime(end);
      
      const seed = date.getDate() * 100 + i;
      const trafficRand = (seed * 1103515245 + 12345) % 100;
      
      let traffic = 'Low';
      let color = 'bg-green-50 border-green-200';
      let textColor = 'text-green-700';
      let indicator = 'bg-green-500';
      let eta = '10-15 mins';
      
      if (trafficRand > 75) {
        traffic = 'Heavy';
        color = 'bg-red-50 border-red-200';
        textColor = 'text-red-700';
        indicator = 'bg-red-500';
        eta = '45+ mins';
      } else if (trafficRand > 40) {
        traffic = 'Moderate';
        color = 'bg-yellow-50 border-yellow-200';
        textColor = 'text-yellow-700';
        indicator = 'bg-yellow-500';
        eta = '20-30 mins';
      }

      const now = new Date();
      if (date.toDateString() === now.toDateString() && end < now) continue;

      slots.push({ id: i, label, traffic, color, textColor, indicator, eta });
    }
    return slots;
  };

  const toggleCrop = (name: string) => {
    const exists = selectedCrops.find(c => c.name === name);
    if (exists) {
      setSelectedCrops(selectedCrops.filter(c => c.name !== name));
    } else {
      setSelectedCrops([...selectedCrops, { name, weight: '' }]);
    }
  };

  const updateWeight = (name: string, weight: string) => {
    setSelectedCrops(selectedCrops.map(c => c.name === name ? { ...c, weight } : c));
  };

  const handleBook = async () => {
    if (!session || !date || selectedCrops.length === 0) return;
    setLoading(true);

    const tokenNumber = 'TKN-' + Date.now().toString().slice(-4);

    const { data: masterToken, error: masterErr } = await supabase
      .from('master_tokens')
      .insert([{
        token_number: tokenNumber,
        farmer_uid: session.farmerUid,
        farmer_name: session.name,
        is_walk_in: false,
        status: 'BOOKED'
      }])
      .select()
      .single();

    if (masterErr || !masterToken) {
      alert('Error booking token');
      setLoading(false);
      return;
    }

    const subLots = selectedCrops.map(c => ({
      sub_id: tokenNumber + '_' + c.name.toUpperCase(),
      master_token_id: masterToken.id,
      crop_name: c.name,
      estimated_weight: parseFloat(c.weight) || 0,
      status: 'PENDING'
    }));

    const { error: subErr } = await supabase.from('crop_sub_lots').insert(subLots);
    
    setLoading(false);
    if (subErr) alert('Error saving crops');
    else router.push('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
        <button onClick={() => step === 1 ? router.push('/dashboard') : setStep(step - 1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg flex-1">Book Slot</h1>
        <div className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
          Step {step}/3
        </div>
      </div>

      <div className="p-4 flex-1">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 pb-24">
            <h2 className="text-lg font-bold mb-3 text-gray-800">1. Select Date</h2>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">{currentMonth}</h3>
                <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-green-600"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Low</span>
                  <span className="flex items-center gap-1 text-yellow-600"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Med</span>
                  <span className="flex items-center gap-1 text-red-600"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> High</span>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-gray-400">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1.5">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {dates.map((d, i) => {
                  const isSelected = date?.toDateString() === d.toDateString();
                  const t = generateDayTraffic(d);
                  return (
                    <button
                      key={i}
                      onClick={() => { setDate(d); setSelectedTimeSlot(null); }}
                      className={"relative flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all " + 
                        (isSelected ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100 shadow-md transform scale-110 z-10' : t.color + ' hover:border-gray-300')}
                    >
                      <span className={"text-sm font-bold " + (isSelected ? 'text-primary-800' : '')}>{d.getDate()}</span>
                      <span className="text-[8px] font-bold mt-0.5 uppercase tracking-tighter opacity-90">{t.traffic}</span>
                      <span className="text-[7px] font-bold text-gray-500 mt-0.5">{t.eta}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {date && (
              <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                <h2 className="text-lg font-bold mb-3 text-gray-800">2. Select Time Slot</h2>
                <div className="space-y-3">
                  {generateTimeSlots(date).length === 0 ? (
                    <div className="text-center p-6 bg-gray-100 rounded-xl text-gray-500 font-medium">No slots available for today. Please select another date.</div>
                  ) : (
                    generateTimeSlots(date).map((slot, i) => {
                      const isSelected = selectedTimeSlot?.id === slot.id;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={"w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between " + 
                            (isSelected ? 'border-primary-500 shadow-md ring-4 ring-primary-50 ' + slot.color : 'border-gray-100 bg-white hover:border-gray-200')}
                        >
                          <div>
                            <p className={"font-bold text-lg " + (isSelected ? 'text-primary-900' : 'text-gray-800')}>{slot.label}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-white border shadow-sm">
                                <div className={"w-2 h-2 rounded-full animate-pulse " + slot.indicator}></div>
                                <span className={slot.textColor}>{slot.traffic} Traffic</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Est. Waiting Time</p>
                            <p className={"font-bold " + (slot.traffic === 'Heavy' ? 'text-red-600' : 'text-gray-700')}>{slot.eta}</p>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <button 
                disabled={!date || !selectedTimeSlot}
                onClick={() => setStep(2)}
                className="w-full max-w-md mx-auto bg-primary-600 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 disabled:bg-gray-400 transition-colors shadow-lg shadow-primary-200"
              >
                Continue to Crops
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 pb-20">
            <h2 className="text-xl font-bold mb-1">Select Crops</h2>
            <p className="text-sm text-gray-500 mb-4">What are you bringing to the Mandi?</p>
            
            <div className="grid grid-cols-2 gap-3">
              {CROPS.map(crop => {
                const isSelected = selectedCrops.some(c => c.name === crop.name);
                const selectedData = selectedCrops.find(c => c.name === crop.name);
                
                return (
                  <div 
                    key={crop.id}
                    className={"rounded-xl border-2 overflow-hidden bg-white transition " + 
                      (isSelected ? 'border-primary-500 shadow-md' : 'border-transparent shadow-sm')}
                  >
                    <div className="relative h-24 w-full cursor-pointer" onClick={() => toggleCrop(crop.name)}>
                      <Image src={crop.img} alt={crop.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white p-1 rounded-full">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 text-white">
                        <p className="font-bold text-lg leading-tight">{crop.hi}</p>
                        <p className="text-xs font-medium opacity-90">{crop.name}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-3 bg-primary-50">
                        <label className="text-xs font-bold text-gray-600 mb-1 block">Est. Weight (Quintal)</label>
                        <input 
                          type="number" 
                          value={selectedData?.weight || ''}
                          onChange={e => updateWeight(crop.name, e.target.value)}
                          className="w-full border rounded p-1.5 text-sm outline-none focus:border-primary-500" 
                          placeholder="e.g. 50"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
              <button 
                disabled={selectedCrops.length === 0}
                onClick={() => setStep(3)}
                className="w-full max-w-md mx-auto bg-primary-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
              >
                Review Booking
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold mb-4">Confirm Details</h2>
            
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Arrival Date</p>
                  <p className="font-bold text-lg text-gray-800">{date?.toDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium mb-1">Time Slot</p>
                  <p className="font-bold text-lg text-primary-700">{selectedTimeSlot?.label}</p>
                </div>
              </div>
              <div className={"mt-3 px-3 py-2 rounded-lg flex items-center justify-between " + selectedTimeSlot?.color}>
                <span className={"font-bold text-sm " + selectedTimeSlot?.textColor}>Queue Traffic: {selectedTimeSlot?.traffic}</span>
                <span className="text-sm font-semibold">ETA: {selectedTimeSlot?.eta}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm mb-8">
              <p className="text-sm text-gray-500 font-medium mb-3">Selected Crops</p>
              <div className="space-y-3">
                {selectedCrops.map(c => (
                  <div key={c.name} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="font-bold">{c.weight || '0'} Qtl</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleBook}
              disabled={loading}
              className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Booking...' : <><Leaf className="w-5 h-5"/> Confirm Booking</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}