import {Package,Layers,Wallet,TrendingUp,PiggyBank,Truck,ShoppingCart,Coins} from 'lucide-react';
import {peso,fmtDate} from '../lib.js';
import {SummaryCard,StockBadge,ReceivedBadge,Timeline,Empty} from '../ui.jsx';

const Section=({title,action,children})=><section className="card pad dsec"><div className="row between sh"><h3>{title}</h3>{action}</div>{children}</section>;
const ProductList=({rows,onOpen,badges,empty})=>rows.length?<ul className="plist">{rows.map(p=><li key={p.id} className="prow">
 <div className="pmain"><button className="link" onClick={()=>onOpen(p.id)}>{p.name}</button><span className="muted xs">Added {fmtDate(p.dateAdded+'T12:00:00')} · {peso(p.sellingPrice)} each</span></div>
 <div className="pmeta"><span className="qty">{p.quantity} pcs</span>{badges(p)}</div></li>)}</ul>:<Empty title="Nothing here" desc={empty}/>;

export default function Dashboard({items,history,summary,open,go}){
 const src={items,history};
 const onOpen=open;
 const list=src.items,t=list.reduce((a,p)=>({q:a.q+p.quantity,c:a.c+p.priceEach*p.initial,s:a.s+p.expectedSales,p:a.p+p.expectedProfit}),{q:0,c:0,s:0,p:0});
 const recent=[...list].sort((a,b)=>(b.dateAdded+(b.createdAt||'')).localeCompare(a.dateAdded+(a.createdAt||''))).slice(0,5);
 const low=list.filter(p=>p.quantity<20).sort((a,b)=>a.quantity-b.quantity).slice(0,6);
 const notRec=list.filter(p=>p.received==='not'),partial=list.filter(p=>p.received==='partial').length;
 const act=[...src.history].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,6);
 const margin=t.s>0?Math.round(t.p/t.s*100):0;
 const viewAll=<button className="link sm" onClick={()=>go('inventory')}>View inventory</button>;
 return <>
 <div className="ph"><div><h1>Dashboard</h1><p className="muted">Overview of your shop inventory</p></div><span className="muted sm">{fmtDate(new Date())}</span></div>
 <div className="cards">
  <SummaryCard icon={Package} tone="pink" label="Total Products" value={list.length} sub={`${list.filter(p=>p.quantity<20).length} low or out of stock`}/>
  <SummaryCard icon={Layers} tone="pink" label="Total Quantity" value={t.q.toLocaleString('en-PH')} sub="units across all products"/>
  <SummaryCard icon={Wallet} tone="pink" label="Total Inventory Cost" value={peso(t.c)} sub="initial stock × price each"/>
  <SummaryCard icon={TrendingUp} tone="pink" label="Expected Sales" value={peso(t.s)} sub="on your full initial stock"/>
  <SummaryCard icon={PiggyBank} tone="pink" label="Expected Profit" value={peso(t.p)} sub={`about ${margin}% margin`}/>
  <SummaryCard icon={Truck} tone="pink" label="Products Not Received" value={notRec.length} sub={partial?`${partial} more partially received`:'waiting for delivery'}/>
  <SummaryCard icon={ShoppingCart} tone="pink" label="Units Sold" value={(summary?.units||0).toLocaleString('en-PH')} sub="from recorded sales"/>
  <SummaryCard icon={Coins} tone="pink" label="Total Sales" value={peso(summary?.revenue||0)} sub="money from sales"/>
  <SummaryCard icon={TrendingUp} tone="pink" label="Sales Profit" value={peso(summary?.profit||0)} sub="sales minus item cost"/>
 </div>
 <div className="dash-grid">
  <Section title="Recent Products" action={viewAll}><ProductList rows={recent} onOpen={onOpen} empty="Add a product to see it here." badges={p=><><StockBadge q={p.quantity}/><ReceivedBadge v={p.received}/></>}/></Section>
  <Section title="Low Stock Products"><ProductList rows={low} onOpen={onOpen} empty="Nothing is running low." badges={p=><StockBadge q={p.quantity}/>}/></Section>
 </div>
 <div className="dash-grid even">
  <Section title="Products Not Received"><ProductList rows={notRec.slice(0,6)} onOpen={onOpen} empty="Everything has arrived." badges={p=><ReceivedBadge v={p.received}/>}/></Section>
  <Section title="Recent Activity" action={<button className="link sm" onClick={()=>go('history')}>View all</button>}><Timeline items={act} showName/></Section>
 </div></>}
