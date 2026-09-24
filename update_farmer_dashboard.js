const fs = require('fs');
let code = fs.readFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\dashboard\\page.tsx', 'utf8');

const oldProfileTab = /\{\/\* ===================== TAB: PROFILE ===================== \*\/\}.*?\{\/\* BOTTOM NAVIGATION \*\/\}/s;
const newProfileTab = `{/* ===================== TAB: PROFILE ===================== */}
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}`;
code = code.replace(oldProfileTab, newProfileTab);

const oldHistoryBtn = /<p className="font-bold text-lg text-gray-900">Rs \{farmerBill.net_amount\}<\/p>\s*<\/div>\s*<\/div>\s*<\/div>/s;
const newHistoryBtn = `<p className="font-bold text-lg text-gray-900">Rs {farmerBill.net_amount}</p>
                            </div>
                          </div>
                          <button onClick={() => {
                            const w = window.open('', '_blank');
                            w.document.write('<html><head><title>J-Bill Download</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;} .header{text-align:center;margin-bottom:20px;} .total{font-size:1.5em;font-weight:bold;margin-top:20px;}</style></head><body>');
                            w.document.write('<div class="header"><h2>APMC Digital J-Bill (Farmer Copy)</h2><p>Bill No: ' + farmerBill.bill_number + '</p><p>Farmer: ' + profileData.full_name + '</p></div>');
                            w.document.write('<table><tr><th>Crop</th><th>Weight (q)</th><th>Rate (Rs/q)</th></tr>');
                            token.crop_sub_lots.forEach(lot => {
                              w.document.write('<tr><td>' + lot.crop_name + '</td><td>' + lot.actual_weight + '</td><td>' + lot.auction_rate + '</td></tr>');
                            });
                            w.document.write('</table>');
                            w.document.write('<div class="total">Net Payable: Rs ' + farmerBill.net_amount + '</div>');
                            w.document.write('</body></html>');
                            w.document.close();
                            setTimeout(() => w.print(), 500);
                          }} className="w-full mt-3 bg-white border border-green-300 text-green-700 py-2 rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-green-100 transition shadow-sm">
                            <Download className="w-4 h-4" /> Download Bill
                          </button>
                        </div>`;
code = code.replace(oldHistoryBtn, newHistoryBtn);

const oldHeader = /<div className="flex justify-between items-center mb-4">\s*<div className="flex items-center gap-2">\s*<Leaf className="w-6 h-6" \/>\s*<h1 className="text-xl font-bold">Upaj Setu<\/h1>\s*<\/div>\s*<button onClick=\{handleLogout\}/s;
const newHeader = `<div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6" />
              <h1 className="text-xl font-bold">Upaj Setu</h1>
            </div>
            <div className="flex items-center gap-3">
              {profileData?.photo_url && (
                <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform">
                  <img src={profileData.photo_url} alt="PFP" className="w-full h-full object-cover" />
                </button>
              )}
              <button onClick={handleLogout}`;
code = code.replace(oldHeader, newHeader);

code = code.replace('import { Leaf, Plus, QrCode, LogOut, Home, History, User, ReceiptText, ChevronRight } from \'lucide-react\';', 'import { Leaf, Plus, QrCode, LogOut, Home, History, User, ReceiptText, ChevronRight, CheckCircle2, Download } from \'lucide-react\';');

fs.writeFileSync('d:\\UPAJ-SETU-V2\\farmers\\app\\dashboard\\page.tsx', code, 'utf8');
