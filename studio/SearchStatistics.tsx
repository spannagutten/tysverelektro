import {useEffect,useState} from 'react'
import {useClient} from 'sanity'
type Row={term:string;searches:number;no_results:number}
export function SearchStatistics(){
 const client=useClient({apiVersion:'2026-11-03'})
 const [days,setDays]=useState(30),[rows,setRows]=useState<Row[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0)
 useEffect(()=>{
  const controller=new AbortController();setBusy(true);setError('');setRows([])
  const token=client.config().token
  if(!token){setError('Innloggingen mangler en økt for statistikk. Logg ut og inn igjen i Sanity.');setBusy(false);return ()=>controller.abort()}
  fetch('/api/search-stats?days='+days,{headers:{Authorization:'Bearer '+token},signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Kunne ikke hente statistikk');return data}).then(data=>setRows(data.rows)).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})
  return ()=>controller.abort()
 },[client,days,refresh])
 const total=rows.reduce((n,r)=>n+r.searches,0),missing=rows.reduce((n,r)=>n+r.no_results,0)
 return <div style={{padding:28,maxWidth:1000,margin:'auto',overflow:'auto',height:'100%',boxSizing:'border-box'}}>
  <h1>Søkestatistikk</h1><p>Hva leter kundene etter på nettsiden?</p>
  <label>Periode: <select value={days} onChange={e=>setDays(Number(e.target.value))}>{[7,30,90].map(n=><option key={n} value={n}>Siste {n} dager</option>)}</select></label>{' '}<button onClick={()=>setRefresh(n=>n+1)} disabled={busy}>Oppdater</button>
  <p>Registrerte søk: <strong>{total}</strong> · Uten treff: <strong>{missing}</strong></p>
  {busy&&<p role="status">Henter statistikk …</p>}{error&&<p role="alert">{error}</p>}
  {!busy&&!error&&(rows.length?<table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><caption style={{textAlign:'left',paddingBottom:12}}>Populære søkeord og søk uten treff</caption><thead><tr><th>Søkeord / gruppe</th><th>Antall søk</th><th>Uten treff</th></tr></thead><tbody>{rows.map(r=><tr key={r.term}><td style={{padding:'12px 0',borderBottom:'1px solid #8885'}}>{r.term}</td><td>{r.searches}</td><td>{r.no_results}</td></tr>)}</tbody></table>:<p>Ingen registrerte søk i perioden ennå.</p>)}
  <p style={{lineHeight:1.7,marginTop:28}}>Bare innsendte søk telles. Kjente fagord lagres som faste søkeord; all annen fritekst samles under «Andre søk». Navn, IP-adresser, e-postadresser og den opprinnelige søketeksten lagres ikke i statistikkdatabasen. Daglige tellinger slettes etter 90 dager. Datoene følger norsk tid.</p>
  <p>Tallene viser søk, ikke unike personer. Roboter, gjentatte søk og personverninnstillinger kan påvirke tallene.</p>
 </div>
}
