const fs = require('fs');
let code = fs.readFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\dashboard\\page.tsx', 'utf8');

const oldHeader = /\{\/\* HEADER \*\/\}.*?<div className="p-4 flex-1">/s;
const newHeader = `{/* HEADER */}
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

      <div className="p-4 flex-1">`;
code = code.replace(oldHeader, newHeader);

const oldProfileLogout = /<p className="font-medium text-gray-800">\{new Date\(profileData\.created_at\)\.toLocaleString\(\)\}<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>/s;
const newProfileLogout = `<p className="font-medium text-gray-800">{new Date(profileData.created_at).toLocaleString()}</p>
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
          </div>`;
code = code.replace(oldProfileLogout, newProfileLogout);

fs.writeFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\dashboard\\page.tsx', code, 'utf8');
