// All Supabase access lives here. The UI only sees the same product/history shapes as before.
import {supabase} from './supabase.js';
import {peso,RECEIVED,PAYMENT_MODES as PM,PAID_STATUS as PAID} from './lib.js';
const R2D={received:'received',partial:'partially_received',not:'not_received'},D2R=Object.fromEntries(Object.entries(R2D).map(([a,b])=>[b,a]));
const T2D={'Product Added':'product_added','Stock Added':'stock_added','Stock Removed':'stock_removed','Product Edited':'product_edited','Selling Price Changed':'selling_price_changed','Received Status Changed':'received_status_changed','Product Deleted':'product_deleted','Sale Recorded':'sale_recorded','Product Restored':'product_restored','Sale Edited':'sale_edited','Sale Deleted':'sale_deleted'},D2T=Object.fromEntries(Object.entries(T2D).map(([a,b])=>[b,a]));
const need=()=>{if(!supabase)throw new Error('Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.')};
const friendly=e=>{const m=String(e?.message||'');if(/fetch|network|load failed/i.test(m))return"Can't reach the server. Check your internet connection and try again.";if(e?.code==='42501'||/permission|row-level/i.test(m))return"You don't have permission to do that.";if(e?.code==='23514')return"One of the values isn't allowed. Please check the numbers and try again.";if(/not found/i.test(m))return'This product no longer exists. It may have been deleted on another device.';if(/Cannot (remove|sell) more/i.test(m))return m;if(/Sale not found/i.test(m))return'This sale no longer exists. It may have been changed on another device.';return'Something went wrong while talking to the database. Please try again.'};
const ok=({data,error})=>{if(error){console.error(error);throw new Error(friendly(error))}return data};
const toProduct=r=>({id:r.id,deletedAt:r.deleted_at||null,name:r.item_name,category:r.category||'',dateAdded:r.date_added,quantity:Math.max(0,+r.quantity||0),wholePrice:+r.whole_price||0,sellingPrice:+r.selling_price||0,unit:+r.unit_cost||0,received:D2R[r.received_status]||'not',paid:r.payment_status==='paid'?'paid':'not_paid',paymentMode:r.payment_mode||'',reference:r.payment_reference||'',sold:Math.max(0,+r.sold_quantity||0),createdAt:r.created_at,updatedAt:r.updated_at});
const toSale=r=>({id:r.id,productId:r.product_id,productName:r.product_name,quantity:r.quantity,unitPrice:+r.unit_price||0,total:+r.total||0,method:r.payment_method,at:r.created_at});
const toHistory=r=>({id:r.id,productId:r.product_id,productName:r.product_name,type:D2T[r.activity_type]||r.activity_type,desc:r.description,change:r.quantity_change,at:r.created_at});
const row=(f,unit,sold=0)=>({item_name:f.name,category:f.category,date_added:f.dateAdded,quantity:f.quantity,whole_price:f.wholePrice,selling_price:f.sellingPrice,received_status:R2D[f.received],payment_status:f.paid==='paid'?'paid':'not_paid',payment_mode:f.paymentMode||null,payment_reference:f.reference?.trim()||null,unit_cost:(f.quantity+sold)>0?f.wholePrice/(f.quantity+sold):unit});

export async function fetchAll(){need();
 const [p,h,s,t]=await Promise.all([supabase.from('products').select('*').order('created_at',{ascending:false}),supabase.from('inventory_history').select('*').order('created_at',{ascending:false}).limit(1000),supabase.from('sales').select('*, products!inner(deleted_at)').is('products.deleted_at',null).order('created_at',{ascending:false}).limit(50),supabase.rpc('sales_summary')]);
 const sm=ok(t)?.[0]||{};
 const all=ok(p).filter(r=>r&&r.id).map(toProduct);
 return{products:all.filter(x=>!x.deletedAt),trash:all.filter(x=>x.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt)),history:ok(h).filter(r=>r&&r.id).map(toHistory),sales:ok(s).filter(r=>r&&r.id).map(toSale),summary:{units:+sm.units||0,revenue:+sm.revenue||0,profit:+sm.profit||0}}}

export async function addProduct(f){need();
 const p=ok(await supabase.from('products').insert(row(f,0)).select().single());
 ok(await supabase.from('inventory_history').insert({product_id:p.id,product_name:p.item_name,activity_type:'product_added',description:`Added with ${p.quantity} units`,quantity_change:p.quantity}))}

export async function editProduct(o,f){need();
 const u=ok(await supabase.from('products').update(row(f,o.unit,o.sold)).eq('id',o.id).select('id'));if(!u.length)throw new Error(friendly({message:'not found'}));
 const logs=[],log=(t,d,c=null)=>logs.push({product_id:o.id,product_name:f.name,activity_type:T2D[t],description:d,quantity_change:c});
 if(f.sellingPrice!==o.sellingPrice)log('Selling Price Changed',`${peso(o.sellingPrice)} → ${peso(f.sellingPrice)}`);
 if(f.received!==o.received)log('Received Status Changed',`${RECEIVED[o.received]} → ${RECEIVED[f.received]}`);
 const ch=[];if(f.name!==o.name)ch.push(`name "${o.name}" → "${f.name}"`);if(f.quantity!==o.quantity)ch.push(`quantity ${o.quantity} → ${f.quantity}`);if(f.wholePrice!==o.wholePrice)ch.push(`whole price ${peso(o.wholePrice)} → ${peso(f.wholePrice)}`);if(f.dateAdded!==o.dateAdded)ch.push('date added');if((f.category||'')!==(o.category||''))ch.push(`category ${o.category||'none'} → ${f.category}`);
 if(f.paid!==o.paid)ch.push(`payment ${PAID[o.paid]} → ${PAID[f.paid]}`);if((f.paymentMode||'')!==o.paymentMode)ch.push(`payment mode ${PM[o.paymentMode]||'none'} → ${PM[f.paymentMode]||'none'}`);if((f.reference||'').trim()!==o.reference)ch.push('reference number');
 if(ch.length||!logs.length)log('Product Edited',ch.length?'Changed '+ch.join(', '):'No field changes',f.quantity-o.quantity||null);
 ok(await supabase.from('inventory_history').insert(logs))}

export async function adjustStock(id,delta){need();ok(await supabase.rpc('adjust_stock',{p_id:id,p_delta:delta}))}
export async function deleteProduct(id){need();ok(await supabase.rpc('delete_product',{p_id:id}))}
export async function restoreProduct(id){need();ok(await supabase.rpc('restore_product',{p_id:id}))}
export async function purgeProduct(id){need();ok(await supabase.rpc('purge_product',{p_id:id}))}
export async function recordSale(id,qty,method,price){need();ok(await supabase.rpc('record_sale',{p_id:id,p_qty:qty,p_method:method,p_price:price}))}
export async function editSale(id,qty,method,price){need();ok(await supabase.rpc('edit_sale',{p_sale:id,p_qty:qty,p_method:method,p_price:price}))}
export async function deleteSale(id){need();ok(await supabase.rpc('delete_sale',{p_sale:id}))}

// Sign-in only. There is no sign-up in the app, and sign-ups are switched off in Supabase.
export async function getSession(){need();const {data}=await supabase.auth.getSession();return data.session}
export const onAuthChange=cb=>{need();return supabase.auth.onAuthStateChange((_e,s)=>cb(s)).data.subscription};
export async function signIn(email,password){need();const {error}=await supabase.auth.signInWithPassword({email,password});if(error){console.error(error);throw new Error(/fetch|network/i.test(error.message)?friendly(error):'Incorrect email or password.')}}
export const signOut=()=>supabase?.auth.signOut();
