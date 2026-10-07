import {useMemo,useState} from 'react';
import {Search,SlidersHorizontal,Plus,X} from 'lucide-react';
import {peso,stockStatus,RECEIVED,inRange,PAYMENT_MODES,CATEGORIES} from '../lib.js';
import {Btn,Field,ReceivedBadge,StockBadge,Empty,Menu,DateFilter,DF,PaidBadge} from '../ui.jsx';

const shortDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const STOCK=[['all','All'],['Normal','Normal'],['Low Stock','Low Stock'],['Very Low','Very Low Stock'],['Out of Stock','Out of Stock']];
const actions=(p,open,act)=>[['View Details',()=>open(p.id)],['Edit',()=>act('edit',p)],['Add Stock',()=>act('add',p)],['Remove Stock',()=>act('remove',p)],['Delete',()=>act('delete',p),1]];

export default function InventoryPage({items,open,act,add}){
 const [q,setQ]=useState(''),[panel,setPanel]=useState(false),[rec,setRec]=useState('all'),[stk,setStk]=useState('all'),[df,setDf]=useState(DF),[pay,setPay]=useState('all'),[cat,setCat]=useState('all');
 const active=(rec!=='all')+(stk!=='all')+(df.mode!=='all')+(pay!=='all')+(cat!=='all');
 const rows=useMemo(()=>items.filter(p=>`${p.name} ${p.category||''} ${p.reference||''}`.toLowerCase().includes(q.trim().toLowerCase())&&(rec==='all'||p.received===rec)&&(pay==='all'||p.paid===pay)&&(cat==='all'||p.category===cat)&&(stk==='all'||stockStatus(p.quantity).label===stk)&&inRange(p.dateAdded+'T12:00:00',df)),[items,q,rec,stk,df,pay,cat]);
 const reset=()=>{setRec('all');setStk('all');setPay('all');setCat('all');setDf(DF)};
 return <>
 <div className="ph"><div><h1>Inventory</h1><p className="muted">Manage your products and stock</p></div><Btn onClick={add}><Plus size={16}/>Add Product</Btn></div>
 <div className="bar"><div className="search"><Search size={16}/><input aria-label="Search products by item name" placeholder="Search item or reference…" value={q} onChange={e=>setQ(e.target.value)}/>{q&&<button className="clear" aria-label="Clear search" onClick={()=>setQ('')}><X size={14}/></button>}</div>
  <Btn v="secondary" aria-expanded={panel} onClick={()=>setPanel(!panel)}><SlidersHorizontal size={16}/>Filter{active>0&&<span className="count">{active}</span>}</Btn></div>
 {panel&&<div className="card pad fpanel"><Field label="Category"><select value={cat} onChange={e=>setCat(e.target.value)}><option value="all">All</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
  <Field label="Received Status"><select value={rec} onChange={e=>setRec(e.target.value)}><option value="all">All</option>{Object.entries(RECEIVED).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field>
  <Field label="Payment"><select value={pay} onChange={e=>setPay(e.target.value)}><option value="all">All</option><option value="paid">Paid</option><option value="not_paid">Not Paid</option></select></Field>
  <Field label="Stock"><select value={stk} onChange={e=>setStk(e.target.value)}>{STOCK.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
  <Field label="Date"><DateFilter v={df} set={setDf}/></Field><Btn v="secondary" onClick={reset} disabled={!active}>Reset filters</Btn></div>}
 {items.length>0&&<p className="muted sm result">Showing {rows.length} of {items.length} product{items.length>1?'s':''}</p>}
 {items.length===0?<div className="card"><Empty title="No products yet" desc="Add your first product to start managing your inventory." action={<Btn onClick={add}>Add Product</Btn>}/></div>
 :rows.length===0?<div className="card"><Empty title="No products found" desc="Try changing your search or filters." action={(q||active>0)&&<Btn v="secondary" onClick={()=>{setQ('');reset()}}>Clear search & filters</Btn>}/></div>
 :<><div className="card tw"><table><thead><tr>{['Date','Item/s Name','Category','Initial Stock','Sold','Remaining Stock','Whole Price','Price Each','Selling Price','Expected Profit','Received','Payment','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
  {rows.map(p=><tr key={p.id}><td className="nw">{shortDate(p.dateAdded)}</td><td><button className="link" onClick={()=>open(p.id)}>{p.name}</button></td><td className="nw">{p.category?<span className="badge b-blue">{p.category}</span>:<span className="muted xs">Uncategorized</span>}</td>
  <td>{p.initial}</td><td>{p.sold}</td><td><div className="qcell"><b>{p.quantity}</b><StockBadge q={p.quantity}/></div></td><td className="nw">{peso(p.wholePrice)}</td><td className="nw">{peso(p.priceEach)}</td><td className="nw">{peso(p.sellingPrice)}</td><td className="nw">{peso(p.expectedProfit)}</td><td><ReceivedBadge v={p.received}/></td><td><div className="qcell"><PaidBadge v={p.paid}/>{p.paymentMode&&<span className="muted xs">{PAYMENT_MODES[p.paymentMode]}</span>}</div></td>
  <td><Menu items={actions(p,open,act)}/></td></tr>)}</tbody></table></div>
  <div className="tcards">{rows.map(p=><article key={p.id} className="card pc"><div className="row between"><div className="pmain"><button className="link" onClick={()=>open(p.id)}>{p.name}</button><span className="muted xs">{shortDate(p.dateAdded)}</span></div><Menu items={actions(p,open,act)}/></div>
  <div className="row">{p.category&&<span className="badge b-blue">{p.category}</span>}<StockBadge q={p.quantity}/><ReceivedBadge v={p.received}/><PaidBadge v={p.paid}/></div>
  {(p.paymentMode||p.reference)&&<span className="muted xs">{[PAYMENT_MODES[p.paymentMode],p.reference&&`Ref: ${p.reference}`].filter(Boolean).join(' · ')}</span>}
  <dl className="pg"><div><dt>Initial Stock</dt><dd>{p.initial}</dd></div><div><dt>Sold</dt><dd>{p.sold}</dd></div><div><dt>Remaining Stock</dt><dd>{p.quantity}</dd></div><div><dt>Whole Price</dt><dd>{peso(p.wholePrice)}</dd></div><div><dt>Price Each</dt><dd>{peso(p.priceEach)}</dd></div><div><dt>Selling Price</dt><dd>{peso(p.sellingPrice)}</dd></div><div className="wide"><dt>Expected Profit</dt><dd>{peso(p.expectedProfit)}</dd></div></dl></article>)}</div></>}</>}
