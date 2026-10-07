import {useState} from 'react';
import {Btn,Field,Empty,Modal,Confirm,Menu} from '../ui.jsx';
import {peso,PAYMENT_MODES,fmtDate,fmtTime} from '../lib.js';

function EditSale({sale,items,onSave,onClose}){
 const p=items.find(x=>x.id===sale.productId),max=(p?p.quantity:0)+sale.quantity,unitPrice=sale.quantity>0?sale.total/sale.quantity:0;
 const [qty,setQty]=useState(String(sale.quantity)),[method,setMethod]=useState(sale.method),[err,setErr]=useState({}),[busy,setBusy]=useState(false);
 const n=Number(qty),whole=qty!==''&&Number.isInteger(n)&&n>0;
 const submit=async ev=>{ev.preventDefault();const e={};
  if(qty===''||!Number.isInteger(n))e.qty='Enter a whole number.';else if(n<=0)e.qty='Quantity must be greater than zero.';else if(n>max)e.qty=`Only ${max} available for this sale.`;
  if(!method)e.method='Choose a payment method.';setErr(e);if(Object.keys(e).length||busy)return;
  if(n===sale.quantity&&method===sale.method){onClose();return}
  setBusy(true);const ok=await onSave(sale,n,method);setBusy(false);if(ok)onClose()};
 return <Modal title="Edit Sale" desc={`${sale.productName} — fix the quantity or payment method. Stock updates automatically.`} onClose={onClose}><form onSubmit={submit} noValidate>
  <div className="grid2"><Field label="Quantity Sold" error={err.qty}><input type="number" inputMode="numeric" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)} autoFocus/></Field>
  <Field label="Payment Method" error={err.method}><select value={method} onChange={e=>setMethod(e.target.value)}>{Object.entries(PAYMENT_MODES).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field></div>
  <div className="calc"><div><span className="muted xs">Price Each</span><b>{peso(unitPrice)}</b></div><div><span className="muted xs">New Total</span><b>{peso(whole?unitPrice*n:0)}</b></div><div><span className="muted xs">Stock After</span><b>{whole&&n<=max?max-n:'—'}</b></div></div>
  <div className="actions"><Btn type="button" v="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy?'Saving…':'Save Changes'}</Btn></div></form></Modal>}

export default function SalesPage({items,sales,onSell,onEdit,onDelete}){
 const [editing,setEditing]=useState(null),[deleting,setDeleting]=useState(null);
 const [pid,setPid]=useState(''),[qty,setQty]=useState(''),[method,setMethod]=useState(''),[err,setErr]=useState({}),[busy,setBusy]=useState(false);
 const p=items.find(x=>x.id===pid),n=Number(qty),whole=Number.isInteger(n)&&n>0,over=p&&whole&&n>p.quantity;
 const check=()=>{const e={};if(!p)e.pid='Please choose a product.';
  if(qty===''||!Number.isInteger(n))e.qty='Enter a whole number.';else if(n<=0)e.qty='Quantity must be greater than zero.';else if(over)e.qty=`Only ${p.quantity} in stock.`;
  if(!method)e.method='Choose a payment method.';return e};
 const submit=async ev=>{ev.preventDefault();const er=check();setErr(er);if(Object.keys(er).length||busy)return;setBusy(true);const ok=await onSell(p,n,method);setBusy(false);if(ok){setPid('');setQty('');setMethod('');setErr({})}};
 const total=p&&whole?p.sellingPrice*n:0;
 return <>
 <div className="ph"><div><h1>Sales</h1><p className="muted">Record sales and keep your stock up to date</p></div></div>
 <div className="dash-grid">
  <section className="card pad dsec"><h3>Record a Sale</h3>
  {items.length===0?<Empty title="No products yet" desc="Add a product in Inventory before recording sales."/>
  :<form onSubmit={submit} noValidate>
   <Field label="Product" error={err.pid}><select value={pid} onChange={e=>setPid(e.target.value)}><option value="">Select a product…</option>{items.map(x=><option key={x.id} value={x.id} disabled={x.quantity===0}>{x.name} — {x.quantity===0?'out of stock':`${x.quantity} in stock`}</option>)}</select></Field>
   <div className="grid2"><Field label="Quantity Sold" error={err.qty||(over?`Only ${p.quantity} in stock.`:'')}><input type="number" inputMode="numeric" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></Field>
   <Field label="Payment Method" error={err.method}><select value={method} onChange={e=>setMethod(e.target.value)}><option value="">Select…</option>{Object.entries(PAYMENT_MODES).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field></div>
   <div className="calc"><div><span className="muted xs">Price Each</span><b>{peso(p?p.sellingPrice:0)}</b></div><div><span className="muted xs">Total</span><b>{peso(total)}</b></div><div><span className="muted xs">Remaining After Sale</span><b>{p?(whole&&!over?p.quantity-n:p.quantity):'—'}</b></div></div>
   <div className="actions"><Btn type="submit" disabled={busy}>{busy?'Saving…':'Save Sale'}</Btn></div></form>}</section>
  <section className="card pad dsec nofx"><h3>Recent Sales</h3>{sales.length?<ul className="plist">{sales.map(s=><li key={s.id} className="prow"><div className="pmain"><b>{s.productName}</b><span className="muted xs">{fmtDate(s.at)} · {fmtTime(s.at)}</span></div><div className="pmeta"><span className="qty">×{s.quantity}</span><span className="badge b-blue">{PAYMENT_MODES[s.method]||s.method}</span><span className="qty">{peso(s.total)}</span><Menu items={[['Edit sale',()=>setEditing(s)],['Delete sale',()=>setDeleting(s),true]]}/></div></li>)}</ul>:<Empty title="No sales yet" desc="Recorded sales will show up here."/>}</section>
 </div>
 {editing&&<EditSale sale={editing} items={items} onSave={onEdit} onClose={()=>setEditing(null)}/>}
 {deleting&&<Confirm title="Delete Sale?" desc={`This removes the sale of ${deleting.quantity} × "${deleting.productName}" (${peso(deleting.total)}) and puts ${deleting.quantity} unit${deleting.quantity===1?'':'s'} back in stock. It will also be removed from your Total Sales and profit.`} label="Delete sale" onYes={async()=>{const d=deleting;setDeleting(null);await onDelete(d)}} onClose={()=>setDeleting(null)}/>}</>}
