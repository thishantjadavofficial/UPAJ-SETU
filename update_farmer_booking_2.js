const fs = require('fs');
let code = fs.readFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\book\\page.tsx', 'utf8');

const oldDatesLogic = /const dates = Array\.from\(\{length: 7\}, \(_, i\) => \{\s*const d = new Date\(\);\s*d\.setDate\(d\.getDate\(\) \+ i\);\s*return d;\s*\}\);/s;
const newDatesLogic = `const today = new Date();
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
  };`;
code = code.replace(oldDatesLogic, newDatesLogic);


const oldStep1UI = /<div className="flex overflow-x-auto gap-3 pb-4 snap-x" style=\{\{ scrollbarWidth: 'none' \}\}>.*?<\/div>\s*\{date && \(/s;
const newStep1UI = `<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
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
                  <div key={\`empty-\${i}\`} className="p-2" />
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

            {date && (`;
code = code.replace(oldStep1UI, newStep1UI);

fs.writeFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\book\\page.tsx', code, 'utf8');
