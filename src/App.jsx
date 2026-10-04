import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import * as api from './api.js';
import {supabase} from './supabase.js';
import {LayoutDashboard,Boxes,History as HIcon,Menu as MenuI,Package,Layers,Wallet,TrendingUp,PiggyBank,Truck,Search,SlidersHorizontal,Plus,Trash2,Store,RotateCcw} from 'lucide-react';
import {peso,calc,stockStatus,RECEIVED,ACTS,fmtDate,inRange,validate,today,PAYMENT_MODES} from './lib.js';
import Dashboard from './dashboard/Dashboard.jsx';
import {Btn,Modal,Confirm,Field,ReceivedBadge,StockBadge,SummaryCard,Empty,Timeline,Menu,DateFilter,DF} from './ui.jsx';
import StockModal from './products/StockModal.jsx';
import Details from './products/ProductDetails.jsx';
import HistoryPage from './history/HistoryPage.jsx';
import InventoryPage from './inventory/InventoryPage.jsx';

const blank={name:'',quantity:'',wholePrice:'',sellingPrice:'',received:'received',dateAdded:today(),paid:'not_paid',paymentMode:'',reference:''};

function ProductForm({init,onSave,onClose}){
 const [f,setF]=useState(init?{name:init.name,quantity:init.quantity,wholePrice:init.wholePrice,sellingPrice:init.sellingPrice,received:init.received,dateAdded:init.dateAdded,paid:init.paid,paymentMode:init.paymentMode,reference:init.reference}:blank);
 const [err,setErr]=useState({}),set=k=>e=>setF({...f,[k]:e.target.value});
 const q=Number(f.quantity)||0,w=Number(f.wholePrice)||0,s=Number(f.sellingPrice)||0,each=q>0?w/q:(init?.unit||0);
 const submit=e=>{e.preventDefault();const er=validate(f);setErr(er);if(!Object.keys(er).length)onSave({...f,name:f.name.trim(),quantity:+f.quantity,wholePrice:+f.wholePrice,sellingPrice:+f.sellingPrice})};
 return <Modal title={init?'Edit Product':'Add Product'} desc="Calculated values update automatically." onClose={onClose}><form onSubmit={submit} noValidate>
 <div className="grid2"><Field label="Item Name" error={err.name}><input value={f.name} onChange={set('name')} autoFocus/></Field>
 <Field label="Date Added"><input type="date" value={f.dateAdded} onChange={set('dateAdded')}/></Field>
 <Field label="Quantity" error={err.quantity}><input type="number" min="0" step="1" value={f.quantity} onChange={set('quantity')}/></Field>
 <Field label="Whole Price (₱)" error={err.wholePrice}><input type="number" min="0" step="0.01" value={f.wholePrice} onChange={set('wholePrice')}/></Field>
 <Field label="Selling Price (₱)" error={err.sellingPrice}><input type="number" min="0" step="0.01" value={f.sellingPrice} onChange={set('sellingPrice')}/></Field>
 <Field label="Received Status"><select value={f.received} onChange={set('received')}>{Object.entries(RECEIVED).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field>
 <Field label="Payment Status"><select value={f.paid} onChange={set('paid')}><option value="not_paid">Not Paid</option><option value="paid">Paid</option></select></Field>
 <Field label="Mode of Payment" error={err.paymentMode}><select value={f.paymentMode} onChange={set('paymentMode')}><option value="">Select…</option>{Object.entries(PAYMENT_MODES).map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field>
 <Field label="Reference Number (optional)" error={err.reference}><input value={f.reference} onChange={set('reference')} maxLength={60} placeholder="e.g. GCash ref no."/></Field></div>
 <div className="calc"><div><span className="muted xs">Price Each</span><b>{peso(each)}</b></div><div><span className="muted xs">Profit Each</span><b>{peso(s-each)}</b></div><div><span className="muted xs">Expected Sales</span><b>{peso(s*q)}</b></div><div><span className="muted xs">Expected Profit</span><b>{peso((s-each)*q)}</b></div></div>
 <div className="actions"><Btn type="button" v="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit">{init?'Save Changes':'Add Product'}</Btn></div></form></Modal>}

export default function App(){
 const [products,setProducts]=useState([]),[history,setHistory]=useState([]),[boot,setBoot]=useState({loading:true,error:''}),busy=useRef(false),[saving,setSaving]=useState(false);
 const [page,setPage]=useState('dashboard'),[nav,setNav]=useState(false),[modal,setModal]=useState(null),[toast,setToast]=useState('');
 const refresh=useCallback(async first=>{try{const d=await api.fetchAll();setProducts(d.products);setHistory(d.history);setBoot({loading:false,error:''})}catch(e){first?setBoot({loading:false,error:e.message}):setToast('Could not refresh: '+e.message)}},[]);
 useEffect(()=>{refresh(true);const v=()=>document.visibilityState==='visible'&&refresh();document.addEventListener('visibilitychange',v);return()=>document.removeEventListener('visibilitychange',v)},[refresh]);
 useEffect(()=>{if(!supabase)return;let t;const kick=()=>{clearTimeout(t);t=setTimeout(()=>refresh(),300)};
  const ch=supabase.channel('inventory-sync').on('postgres_changes',{event:'*',schema:'public',table:'products'},kick).on('postgres_changes',{event:'*',schema:'public',table:'inventory_history'},kick).subscribe();
  return()=>{clearTimeout(t);supabase.removeChannel(ch)}},[refresh]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2500);return()=>clearTimeout(t)},[toast]);
 const ret=()=>modal?.back?{k:'view',id:modal.id}:null;
 const items=useMemo(()=>products.map(calc),[products]);
 const find=id=>items.find(p=>p.id===id);
 const run=async(fn,msg,m=null)=>{if(busy.current)return;busy.current=true;setSaving(true);try{await fn();await refresh();setModal(m);setToast(msg)}catch(e){setToast('Something went wrong: '+e.message);refresh()}finally{busy.current=false;setSaving(false)}};
 const addP=f=>run(()=>api.addProduct(f),'Product added successfully.');
 const editP=(o,f)=>run(()=>api.editProduct(o,f),f.received!==o.received&&f.name===o.name&&f.quantity===o.quantity&&f.wholePrice===o.wholePrice&&f.sellingPrice===o.sellingPrice&&f.dateAdded===o.dateAdded&&f.paid===o.paid&&f.paymentMode===o.paymentMode&&f.reference===o.reference?'Received status updated.':'Product updated successfully.',ret());
 const stock=(p,v,add)=>run(()=>api.adjustStock(p.id,add?v:-v),add?'Stock added successfully.':'Stock removed successfully.',ret());
 const del=p=>run(()=>api.deleteProduct(p.id),'Product deleted successfully.');
 const act=(k,p)=>setModal({k:k==='add'?'add_stock':k,id:p.id});
 const cur=modal&&modal.id?find(modal.id):null;
 const closeM=()=>setModal(modal?.back&&cur?{k:'view',id:modal.id}:null);
 useEffect(()=>{if(modal&&modal.id&&!cur)setModal(null)},[modal,cur]);
 const NavI=([k,I,l])=><button key={k} className={`nav ${page===k?'on':''}`} aria-current={page===k?'page':undefined} onClick={()=>{setPage(k);setNav(false)}}><I size={18}/>{l}</button>;
 if(boot.loading||boot.error)return <div className="boot">{boot.loading?<div className="loading" role="status"><span className="spin"/>{{dashboard:'Loading dashboard…',inventory:'Loading products…',history:'Loading history…'}[page]}</div>:<div className="card"><Empty title="Couldn't load inventory" desc={boot.error} action={<Btn onClick={()=>{setBoot({loading:true,error:''});refresh(true)}}>Try again</Btn>}/></div>}</div>;
 return <div className={`app ${saving?'saving':''}`}>{saving&&<div className="savebar" role="status" aria-label="Saving"/>}<aside className={`side ${nav?'open':''}`}><div className="brand"><span className="logo"><Store size={18}/></span><div><b>My Shop</b><div className="muted xs">Inventory</div></div></div>
 <nav>{[['dashboard',LayoutDashboard,'Dashboard'],['inventory',Boxes,'Inventory'],['history',HIcon,'History']].map(NavI)}</nav>
 <div className="side-b"><p className="muted xs">Saved to Supabase and synced across your devices.</p></div></aside>
 {nav&&<div className="scrim" onClick={()=>setNav(false)}/>}
 <div className="main"><header className="top"><button className="icon" aria-label="Open menu" onClick={()=>setNav(true)}><MenuI size={20}/></button><b>My Shop</b></header>
 <main>{page==='dashboard'&&<Dashboard items={items} history={history} open={id=>setModal({k:'view',id})} go={setPage}/>}
 {page==='inventory'&&<InventoryPage items={items} open={id=>setModal({k:'view',id})} act={act} add={()=>setModal({k:'add'})}/>}
 {page==='history'&&<HistoryPage history={history} has={id=>!!find(id)} open={id=>setModal({k:'view',id})}/>}</main></div>
 {modal?.k==='add'&&<ProductForm onSave={addP} onClose={()=>setModal(null)}/>}
 {modal?.k==='edit'&&cur&&<ProductForm init={cur} onSave={f=>editP(cur,f)} onClose={closeM}/>}
 {(modal?.k==='add_stock'||modal?.k==='remove')&&cur&&<StockModal p={cur} mode={modal.k==='remove'?'remove':'add'} onSave={v=>stock(cur,v,modal.k!=='remove')} onClose={closeM}/>}
 {modal?.k==='view'&&cur&&<Details p={cur} history={history.filter(h=>h.productId===cur.id)} act={(k,x)=>setModal({k:k==='add'?'add_stock':k,id:x.id,back:true})} onClose={()=>setModal(null)}/>}
 {modal?.k==='delete'&&cur&&<Confirm title="Delete Product?" desc={`Are you sure you want to delete this product? "${cur.name}" will be removed. This action cannot be undone.`} label="Delete" onYes={()=>del(cur)} onClose={closeM}/>}
 {toast&&<div className="toast" role="status">{toast}</div>}</div>}
