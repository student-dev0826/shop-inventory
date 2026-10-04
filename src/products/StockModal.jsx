import {useState} from 'react';
import {Modal,Btn,Field,StockBadge} from '../ui.jsx';

export default function StockModal({p,mode,onSave,onClose}){
 const add=mode==='add',[n,setN]=useState(''),[touched,setTouched]=useState(false),v=Number(n),u=q=>`${q} unit${q===1?'':'s'}`;
 const error=n===''?'Please enter a quantity.':!Number.isInteger(v)?'Enter a whole number.':v===0?'Quantity cannot be zero.':v<0?'Quantity cannot be negative.'
  :!add&&p.quantity===0?'This product is out of stock, so there is nothing to remove.':!add&&v>p.quantity?`You can only remove up to ${u(p.quantity)}.`:'';
 const shown=touched||n!==''?error:'',nq=error?p.quantity:add?p.quantity+v:p.quantity-v;
 const submit=e=>{e.preventDefault();setTouched(true);if(!error)onSave(v)};
 return <Modal title={add?'Add Stock':'Remove Stock'} desc={p.name} onClose={onClose}><form onSubmit={submit} noValidate>
  <div className="calc"><div><span className="muted xs">Current Quantity</span><b>{p.quantity}</b><StockBadge q={p.quantity}/></div></div>
  <Field label={add?'Quantity to Add':'Quantity to Remove'} error={shown}><input type="number" inputMode="numeric" min="1" step="1" value={n} onChange={e=>setN(e.target.value)} autoFocus/></Field>
  <div className="calc"><div><span className="muted xs">New Quantity</span><b>{nq}</b></div><div><span className="muted xs">New Stock Status</span><StockBadge q={nq}/></div></div>
  <div className="actions"><Btn type="button" v="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit">{add?'Add Stock':'Remove Stock'}</Btn></div></form></Modal>}
