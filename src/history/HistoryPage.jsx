import {useMemo,useState} from 'react';
import {Search,X} from 'lucide-react';
import {ACTS,inRange,fmtDate} from '../lib.js';
import {Btn,Empty,Timeline,DateFilter,DF} from '../ui.jsx';

const dayLabel=iso=>{const k=new Date(iso).toDateString(),n=Date.now();return k===new Date(n).toDateString()?'Today':k===new Date(n-864e5).toDateString()?'Yesterday':fmtDate(iso)};

export default function HistoryPage({history,open,has}){
 const [q,setQ]=useState(''),[a,setA]=useState('all'),[df,setDf]=useState(DF);
 const active=(a!=='all')+(df.mode!=='all')+(q.trim()?1:0);
 const rows=useMemo(()=>{const s=q.trim().toLowerCase();return history.filter(h=>(a==='all'||h.type===a)&&inRange(h.at,df)&&(!s||`${h.productName} ${h.desc} ${h.type}`.toLowerCase().includes(s)))},[history,q,a,df]);
 const groups=useMemo(()=>{const m=new Map();rows.forEach(h=>{const k=new Date(h.at).toDateString();m.has(k)?m.get(k).push(h):m.set(k,[h])});return[...m.values()]},[rows]);
 const reset=()=>{setQ('');setA('all');setDf(DF)};
 return <>
 <div className="ph"><div><h1>History</h1><p className="muted">Every change to your inventory</p></div></div>
 <div className="bar"><div className="search"><Search size={16}/><input aria-label="Search history" placeholder="Search product or activity…" value={q} onChange={e=>setQ(e.target.value)}/>{q&&<button className="clear" aria-label="Clear search" onClick={()=>setQ('')}><X size={14}/></button>}</div>
  <select aria-label="Activity filter" value={a} onChange={e=>setA(e.target.value)}><option value="all">All activities</option>{ACTS.map(x=><option key={x}>{x}</option>)}</select>
  <DateFilter v={df} set={setDf}/>{active>0&&<Btn v="secondary" onClick={reset}>Reset</Btn>}</div>
 {history.length>0&&<p className="muted sm result">Showing {rows.length} of {history.length} activit{history.length===1?'y':'ies'}</p>}
 {history.length===0?<div className="card"><Empty title="No activity yet" desc="Adding products and changing stock will show up here."/></div>
 :rows.length===0?<div className="card"><Empty title="No activity found" desc="Try changing your search or filters." action={<Btn v="secondary" onClick={reset}>Clear search & filters</Btn>}/></div>
 :<div className="card pad">{groups.map((g,i)=><section key={g[0].at}><h3 className={`dayh ${i?'':'first'}`}>{dayLabel(g[0].at)}</h3><Timeline items={g} showName onOpen={open} has={has}/></section>)}</div>}</>}
