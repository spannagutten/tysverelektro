// Shared matching for suggestions and the complete results page.
export const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ø/g,'o').replace(/æ/g,'ae');
export function searchItems(items, query) {
 const terms=normalize(String(query).slice(0,100)).trim().split(/\s+/).filter(Boolean);
 if(!terms.length) return [];
 return items.map(item=>{
  const title=normalize(item.title), summary=normalize(item.summary), text=normalize(item.text);
  const score=terms.every(term=>(title+' '+summary+' '+text).includes(term)) ? terms.reduce((sum,term)=>sum+(title===term?120:title.includes(term)?40:summary.includes(term)?12:2),0):0;
  return {item,score};
 }).filter(hit=>hit.score>0).sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'nb')).map(hit=>hit.item);
}
