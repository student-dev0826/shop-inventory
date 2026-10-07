// Utils, calculations & storage. Swap load/save for Supabase calls later.
export const peso=n=>'₱'+(Number.isFinite(n)?n:0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const today=()=>new Date().toISOString().slice(0,10);
export const calc=p=>{const q=num(p.quantity),s=num(p.sellingPrice),u=(q+num(p.sold))>0?num(p.wholePrice)/(q+num(p.sold)):num(p.unit),pe=s-u;return{...p,quantity:q,sold:num(p.sold),initial:q+num(p.sold),priceEach:u,profitEach:pe,expectedSales:s*(q+num(p.sold)),expectedProfit:pe*(q+num(p.sold))}};
export const stockStatus=q=>q>=20?{label:'Normal',cls:'b-blue'}:q>=5?{label:'Low Stock',cls:'b-orange'}:q>=1?{label:'Very Low',cls:'b-orange'}:{label:'Out of Stock',cls:'b-red'};
export const PAYMENT_MODES={cash:'Cash',gcash:'GCash',gotyme:'Gotyme',maribank:'Maribank',other:'Other'};
export const CATEGORIES=['Shirts','Toys','Jewelries','Bags & Wallets'];
export const PAID_STATUS={paid:'Paid',not_paid:'Not Paid'};
export const RECEIVED={received:'Received',partial:'Partially Received',not:'Not Received'};
export const ACTS=['Product Added','Stock Added','Stock Removed','Product Edited','Selling Price Changed','Received Status Changed','Product Deleted','Product Restored','Sale Recorded'];
export const fmtDate=d=>new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
export const fmtTime=d=>new Date(d).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
export function inRange(date,f){if(!f||f.mode==='all')return true;const d=new Date(date),n=new Date(),sod=new Date(n.getFullYear(),n.getMonth(),n.getDate());
 if(f.mode==='today')return d>=sod;if(f.mode==='week')return d>=new Date(sod-sod.getDay()*864e5);if(f.mode==='month')return d>=new Date(n.getFullYear(),n.getMonth(),1);
 if(f.mode==='custom'){if(f.from&&d<new Date(f.from+'T00:00:00'))return false;if(f.to&&d>new Date(f.to+'T23:59:59'))return false}return true}
export function validate(f){const e={},q=f.quantity,w=f.wholePrice,s=f.sellingPrice;
 if(!String(f.name||'').trim())e.name='Please enter an item name.';
 if(!CATEGORIES.includes(f.category))e.category='Please choose a category.';
 if(q===''||!Number.isInteger(Number(q))||Number(q)<0)e.quantity='Enter a whole number, 0 or more.';
 if(w===''||!(Number(w)>=0))e.wholePrice='Enter a valid price, 0 or more.';
 if(s===''||!(Number(s)>=0))e.sellingPrice='Enter a valid price, 0 or more.';
 if(f.paid==='paid'&&!f.paymentMode)e.paymentMode='Choose how this was paid.';if(String(f.reference||'').length>60)e.reference='Keep the reference under 60 characters.';return e}
const KEY='shop_inventory_v1';
