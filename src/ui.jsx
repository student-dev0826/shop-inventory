import {useEffect,useState} from 'react';
import {X,MoreVertical,CheckCircle2,Clock,CircleDashed,AlertTriangle,AlertOctagon,PackageX,CheckCheck,PackageOpen} from 'lucide-react';
import {stockStatus,fmtDate,fmtTime,peso} from './lib.js';
export const Btn=({v='primary',className='',...p})=><button {...p} className={`btn ${v} ${className}`}/>;
export function Modal({title,desc,onClose,children}){
 useEffect(()=>{const k=e=>e.key==='Escape'&&onClose();addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[onClose]);
 return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal" role="dialog" aria-modal="true" aria-label={title}>
 <div className="mh"><div><h2>{title}</h2>{desc&&<p className="muted">{desc}</p>}</div><button className="icon" aria-label="Close" onClick={onClose}><X size={18}/></button></div>{children}</div></div>}
export const Confirm=({title,desc,label,onYes,onClose})=><Modal title={title} desc={desc} onClose={onClose}><div className="actions"><Btn v="secondary" onClick={onClose}>Cancel</Btn><Btn v="danger" onClick={onYes}>{label}</Btn></div></Modal>;
export const Field=({label,error,children})=><label className="field"><span>{label}</span>{children}{error&&<em role="alert">{error}</em>}</label>;
const RB={received:['Received',CheckCircle2,'b-blue'],partial:['Partially Received',Clock,'b-orange'],not:['Not Received',CircleDashed,'b-gray']};
export const ReceivedBadge=({v})=>{const [l,I,c]=RB[v]||RB.not;return <span className={`badge ${c}`}><I size={13}/>{l}</span>};
const SI={'Normal':CheckCheck,'Low Stock':AlertTriangle,'Very Low':AlertOctagon,'Out of Stock':PackageX};
export const StockBadge=({q})=>{const s=stockStatus(q),I=SI[s.label];return <span className={`badge ${s.cls}`}><I size={13}/>{s.label}</span>};
export const SummaryCard=({icon:I,label,value,sub,tone})=><div className="card sum"><div className={`ico ${tone}`}><I size={20}/></div><div><div className="muted sm">{label}</div><div className="big">{value}</div>{sub&&<div className="muted xs">{sub}</div>}</div></div>;
export const Empty=({title,desc,action})=><div className="empty"><PackageOpen size={36}/><h3>{title}</h3><p className="muted">{desc}</p>{action}</div>;
const AC={'Sale Recorded':'a-pink','Product Added':'a-pink','Stock Added':'a-blue','Stock Removed':'a-orange','Product Edited':'a-blue','Selling Price Changed':'a-blue','Received Status Changed':'a-blue','Product Deleted':'a-red'};
export const Timeline=({items,showName,onOpen,has})=>items.length?<ul className="timeline">{items.map(h=><li key={h.id}><span className={`dot ${AC[h.type]}`}/><div className="tl"><div className="row"><span className={`badge ${AC[h.type]}`}>{h.type}</span>{showName&&(onOpen&&has?.(h.productId)?<button className="link" onClick={()=>onOpen(h.productId)}>{h.productName}</button>:<strong>{h.productName}</strong>)}</div><div>{h.desc}</div><div className="muted xs">{fmtDate(h.at)} · {fmtTime(h.at)}</div></div></li>)}</ul>:<Empty title="No activity found" desc="Try changing your search or filters."/>;
export function Menu({items}){
 const [pos,setPos]=useState(null);
 useEffect(()=>{if(!pos)return;const c=()=>setPos(null);addEventListener('click',c);addEventListener('scroll',c,true);return()=>{removeEventListener('click',c);removeEventListener('scroll',c,true)}},[pos]);
 return <><button className="icon" aria-label="Open actions menu" aria-haspopup="menu" onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setPos(pos?null:{top:r.bottom+4,left:Math.max(8,r.right-176)})}}><MoreVertical size={18}/></button>
 {pos&&<div className="menu" role="menu" style={pos}>{items.map(([l,fn,d])=><button key={l} role="menuitem" className={d?'danger-t':''} onClick={()=>{setPos(null);fn()}}>{l}</button>)}</div>}</>}
export const Money=({v})=>peso(v);
export const DF={mode:'all',from:'',to:''};
export const DateFilter=({v,set})=><div className="dfl"><select aria-label="Date filter" value={v.mode} onChange={e=>set({...v,mode:e.target.value})}><option value="all">All dates</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="custom">Custom Date Range</option></select>
 {v.mode==='custom'&&<><input type="date" aria-label="From date" value={v.from} onChange={e=>set({...v,from:e.target.value})}/><input type="date" aria-label="To date" value={v.to} onChange={e=>set({...v,to:e.target.value})}/></>}</div>;
export const PaidBadge=({v})=>v==='paid'?<span className="badge b-blue"><CheckCircle2 size={13}/>Paid</span>:<span className="badge b-orange"><AlertTriangle size={13}/>Not Paid</span>;
