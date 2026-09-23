export const billPrintStyles = `
  body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
  .page { page-break-after: always; padding: 20px; border: 2px solid #333; margin-bottom: 20px; border-radius: 8px; }
  .page:last-child { page-break-after: auto; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  .title { font-size: 24px; font-weight: bold; }
  .subtitle { font-size: 18px; font-weight: bold; background: #eee; padding: 4px; display: inline-block; margin-top: 5px; }
  .details-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .details-box { border: 1px solid #ccc; padding: 10px; width: 48%; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #000; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; }
  .summary { border: 1px solid #000; padding: 10px; margin-left: auto; width: 50%; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
  .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
`;

export function generateSingleBillHtml(billData: any, type: 'FARMER' | 'VEPARI' | 'AGENT' | 'MANDI') {
  let subtitle = '';
  let netAmount = 0;
  
  if (type === 'FARMER') {
    subtitle = 'Farmer Copy (J-Bill)';
    netAmount = billData.farmer_net;
  } else if (type === 'VEPARI') {
    subtitle = 'Vepari Copy (Invoice)';
    netAmount = billData.vepari_net;
  } else if (type === 'AGENT') {
    subtitle = 'Agent Record Copy';
    netAmount = billData.gross_amount; // Agent just sees the raw transaction mostly
  } else if (type === 'MANDI') {
    subtitle = 'Mandi Officer Review Copy';
    netAmount = billData.gross_amount; // APMC review copy
  }

  return `
    <div class="page">
      <div class="header">
        <div class="title">UPAJ SETU V2 Official Bill</div>
        <div class="subtitle">${subtitle}</div>
        <div>Date: ${new Date().toLocaleDateString()} | Token: ${billData.token_number}</div>
      </div>
      
      <div class="details-row">
        <div class="details-box">
          <strong>Farmer Details:</strong><br/>
          Name: ${billData.farmer_name}<br/>
          UID: ${billData.farmer_uid}
        </div>
        <div class="details-box">
          <strong>Buyer (Vepari) Details:</strong><br/>
          Name: ${billData.vepari_name || 'Multiple Buyers'}<br/>
          GST: ${billData.vepari_gst || 'N/A'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Actual Weight (q)</th>
            <th>Rate (₹/q)</th>
            <th>Gross Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${billData.lots.map((lot: any) => `
            <tr>
              <td>${lot.crop_name}</td>
              <td>${lot.actual_weight}</td>
              <td>${lot.auction_rate}</td>
              <td>${(lot.actual_weight * lot.auction_rate).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row"><span>Gross Amount:</span> <span>₹${billData.gross_amount.toFixed(2)}</span></div>
        ${type === 'FARMER' ? `
          <div class="summary-row"><span>Unloading Fee (${billData.fees.farmer_unloading_fee_percent}%):</span> <span>-₹${((billData.gross_amount * billData.fees.farmer_unloading_fee_percent) / 100).toFixed(2)}</span></div>
          <div class="summary-row"><span>Agent Commission (${billData.fees.agent_commission_percent}%):</span> <span>-₹${((billData.gross_amount * billData.fees.agent_commission_percent) / 100).toFixed(2)}</span></div>
        ` : type === 'VEPARI' ? `
          <div class="summary-row"><span>Market Fee (${billData.fees.market_fee_percent}%):</span> <span>₹${((billData.gross_amount * billData.fees.market_fee_percent) / 100).toFixed(2)}</span></div>
          <div class="summary-row"><span>GST (${billData.fees.gst_percent}%):</span> <span>₹${((billData.gross_amount * billData.fees.gst_percent) / 100).toFixed(2)}</span></div>
        ` : `
          <div class="summary-row"><span>Total Deductions/Taxes applied on respective parties.</span></div>
        `}
        <div class="summary-row total">
          <span>${type === 'FARMER' ? 'Net Payable to Farmer:' : type === 'VEPARI' ? 'Net Payable by Vepari:' : 'Total Trade Value:'}</span> 
          <span>₹${netAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>This is a computer-generated document for UPAJ SETU V2 System.</p>
        <p>Placeholder Format - Exact styling to be updated later.</p>
      </div>
    </div>
  `;
}

export function generateCombinedBillsHtml(billData: any) {
  return `
    <html>
      <head>
        <title>UPAJ SETU V2 Bills - ${billData.token_number}</title>
        <style>${billPrintStyles}</style>
      </head>
      <body>
        ${generateSingleBillHtml(billData, 'FARMER')}
        ${generateSingleBillHtml(billData, 'VEPARI')}
        ${generateSingleBillHtml(billData, 'AGENT')}
        ${generateSingleBillHtml(billData, 'MANDI')}
      </body>
    </html>
  `;
}
