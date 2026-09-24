const fs = require('fs');
let code = fs.readFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\book\\page.tsx', 'utf8');

// 1. Add selectedTimeSlot state
code = code.replace(
  'const [selectedCrops, setSelectedCrops]',
  'const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);\n  const [selectedCrops, setSelectedCrops]'
);

// 2. Add generateTimeSlots function
const generateTimeSlotsCode = `
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
`;
code = code.replace('const toggleCrop = (name: string) => {', generateTimeSlotsCode + '\n  const toggleCrop = (name: string) => {');

// 3. Replace step 1 UI
const oldStep1 = /\{step === 1 && \(\s*<div className="animate-in fade-in slide-in-from-right-4">.*?<\/button>\s*<\/div>\s*\)\}/s;
const newStep1 = `{step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 pb-24">
            <h2 className="text-lg font-bold mb-3 text-gray-800">1. Select Date</h2>
            
            <div className="flex overflow-x-auto gap-3 pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
              {dates.map((d, i) => {
                const isSelected = date?.toDateString() === d.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => { setDate(d); setSelectedTimeSlot(null); }}
                    className={"snap-start shrink-0 w-[4.5rem] py-3 rounded-2xl border-2 text-center transition-all " + 
                      (isSelected ? 'border-primary-500 bg-primary-50 shadow-md transform scale-105' : 'border-gray-100 bg-white shadow-sm')}
                  >
                    <p className={"text-[10px] font-bold uppercase tracking-wider mb-1 " + (isSelected ? 'text-primary-600' : 'text-gray-400')}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={"text-2xl font-black " + (isSelected ? 'text-primary-800' : 'text-gray-800')}>
                      {d.getDate()}
                    </p>
                    <p className={"text-[10px] font-bold " + (isSelected ? 'text-primary-600' : 'text-gray-400')}>
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </button>
                )
              })}
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
        )}`;
code = code.replace(oldStep1, newStep1);

// 4. Also update Step 3 Confirmation Details to show selected time slot
const oldStep3Details = /<p className="text-sm text-gray-500 font-medium mb-1">Date<\/p>\s*<p className="font-bold text-lg text-gray-800">\{date\?\.toDateString\(\)\}<\/p>/s;
const newStep3Details = `<div className="flex justify-between items-start">
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
              </div>`;
code = code.replace(oldStep3Details, newStep3Details);

fs.writeFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\book\\page.tsx', code, 'utf8');
