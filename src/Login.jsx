import {useState} from 'react';
import {Btn,Field} from './ui.jsx';
import * as api from './api.js';
import logo from '../logo/kerstinelogohd.jpg';

export default function Login(){
 const [email,setEmail]=useState(''),[pw,setPw]=useState(''),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const submit=async e=>{e.preventDefault();if(!email.trim()||!pw){setErr('Enter your email and password.');return}setBusy(true);setErr('');try{await api.signIn(email.trim(),pw)}catch(x){setErr(x.message);setBusy(false)}};
 return <div className="boot"><form className="card pad login" onSubmit={submit} noValidate>
  <div className="brand"><img className="logo-img" src={logo} alt="Kerstine Styles logo"/><div><b>Kerstine Styles</b><div className="muted xs">Inventory</div></div></div>
  <h2>Sign in</h2><p className="muted" style={{marginBottom:16}}>Private access only.</p>
  <Field label="Email"><input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} autoFocus/></Field>
  <Field label="Password" error={err}><input type="password" autoComplete="current-password" value={pw} onChange={e=>setPw(e.target.value)}/></Field>
  <Btn type="submit" disabled={busy} className="wide">{busy?'Signing in…':'Sign in'}</Btn></form></div>
}
