import {Component} from 'react';
export default class ErrorBoundary extends Component{
 state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(e){console.error(e)}
 render(){return this.state.failed?<div className="boot"><div className="card pad"><h3>Something went wrong</h3><p className="muted">The page ran into an unexpected problem. Your data is safe in the database.</p><button className="btn primary" style={{marginTop:14}} onClick={()=>location.reload()}>Reload</button></div></div>:this.props.children}}
