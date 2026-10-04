import {useState} from 'react';
import {Modal,Btn,ReceivedBadge,StockBadge,Timeline,PaidBadge} from '../ui.jsx';
import {peso,fmtDate,PAYMENT_MODES} from '../lib.js';

export default function ProductDetails({p,history,act,onClose}){
 const [showH,setShowH]=useState(false);
 const rows=[['Item Name',p.name],['Date Added',fmtDate(p.dateAdded+'T12:00:00')],['Current Quantity',p.quantity],['Whole Price',peso(p.wholePrice)],['Price Each',peso(p.priceEach)],['Selling Price',peso(p.sellingPrice)],['Profit Each',peso(p.profitEach)],['Expected Sales',peso(p.expectedSales)],['Expected Profit',peso(p.expectedProfit)]];
 return <Modal title="Product Details" desc={p.name} onClose={onClose}>
  <div className="grid2 det">{rows.map(([l,v])=><div key={l}><span className="muted xs">{l}</span><b>{v}</b></div>)}
   <div><span className="muted xs">Received Status</span><ReceivedBadge v={p.received}/></div><div><span className="muted xs">Stock Status</span><StockBadge q={p.quantity}/></div><div><span className="muted xs">Payment Status</span><PaidBadge v={p.paid}/></div><div><span className="muted xs">Mode of Payment</span><b>{PAYMENT_MODES[p.paymentMode]||'—'}</b></div><div><span className="muted xs">Reference Number</span><b>{p.reference||'—'}</b></div></div>
  <div className="actions wrap"><Btn v="secondary" onClick={()=>act('edit',p)}>Edit Product</Btn><Btn v="secondary" onClick={()=>act('add',p)}>Add Stock</Btn><Btn v="secondary" onClick={()=>act('remove',p)} disabled={p.quantity===0}>Remove Stock</Btn><Btn v="secondary" aria-expanded={showH} onClick={()=>setShowH(!showH)}>{showH?'Hide':'View'} History</Btn><Btn v="danger" onClick={()=>act('delete',p)}>Delete Product</Btn></div>
  {showH&&<><h3>History ({history.length})</h3><Timeline items={history}/></>}</Modal>}
