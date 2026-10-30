import { useEffect, useState } from 'react'
export function AnimatedNumber({value,format='money'}:{value:number;format?:'money'|'percent'}) {
 const [display,setDisplay]=useState(value)
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setDisplay(value);return}
  let frame=0;let start:number|undefined
  const tick=(now:number)=>{start??=now;const progress=Math.min((now-start)/700,1);setDisplay(value*(1-Math.pow(1-progress,3)));if(progress<1)frame=requestAnimationFrame(tick)}
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)
 },[value])
 return <span>{format==='money'?new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(display):`${Math.round(display)}%`}</span>
}
