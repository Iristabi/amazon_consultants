import {useEffect,useRef,useState} from 'react';
export default function Navigation({current}) {
 const [open,setOpen]=useState(false); const button=useRef(null); const nav=useRef(null);
 useEffect(()=>{
  if(!open)return;
  const escape=event=>{if(event.key==='Escape'){setOpen(false);button.current?.focus();}};
  const outside=event=>{if(!nav.current?.contains(event.target)&&!button.current?.contains(event.target))setOpen(false);};
  document.addEventListener('keydown',escape);document.addEventListener('pointerdown',outside);
  return()=>{document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);};
 },[open]);
 return <><button ref={button} className="menu-button" aria-expanded={open} aria-controls="main-nav" onClick={()=>setOpen(!open)}>{open?'Close ✕':'Menu ☰'}</button><nav ref={nav} id="main-nav" className={open?'navigation open':'navigation'} aria-label="Main navigation">{[['/services/','Advertising'],['/about/','About'],['/blog/','Insights']].map(([href,label])=><a key={href} href={href} aria-current={current===href?'page':undefined}>{label}</a>)}<a className="button small" href="/contact/">Book a consultation <span>↗</span></a></nav></>;
}
