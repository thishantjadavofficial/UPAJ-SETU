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
  const [selectedCrops, setSelectedCrops] = useState<{name: string, weight: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) router.push('/');
    else setSessionData(s);
  }, [router]);

  const dates = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

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
          <div className="animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold mb-4">Select Date</h2>
            <div className="grid grid-cols-2 gap-3">
              {dates.map((d, i) => {
                const isSelected = date?.toDateString() === d.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => setDate(d)}
                    className={"p-4 rounded-xl border-2 text-left transition " + 
                      (isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent bg-white shadow-sm')}
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {d.getDate()}
                    </p>
                    <p className="text-sm font-medium text-gray-600">
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </button>
                )
              })}
            </div>
            <button 
              disabled={!date}
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-primary-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              Continue
            </button>
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
              <p className="text-sm text-gray-500 font-medium mb-1">Date</p>
              <p className="font-bold text-lg text-gray-800">{date?.toDateString()}</p>
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