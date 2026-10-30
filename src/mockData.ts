export const departments = [
  { _id: 'ventures', name: 'Ventures', category: 'Event', events: ['Idea Up', 'Talent Internships'], color: '#6366f1' },
  { _id: 'impact', name: 'Impact', category: 'Event', events: ['F4X', 'Hired', 'Case Tracking'], color: '#f97316' },
  { _id: 'innovation', name: 'Innovation', category: 'Event', events: ['FFN', 'VC101'], color: '#a855f7' },
  { _id: 'sports', name: 'Sports', category: 'Event', events: ['PACED', 'Game Changers'], color: '#22a06b' },
  { _id: 'marketing', name: 'Marketing', category: 'Supporting', events: [], color: '#e55265' },
  { _id: 'hr', name: 'HR', category: 'Supporting', events: [], color: '#eab308' },
  { _id: 'data-ai', name: 'Data and AI', category: 'Supporting', events: [], color: '#3b82f6' },
  { _id: 'board', name: 'Institutional Board', category: 'Client-Facing', events: [], color: '#14b8a6' },
  { _id: 'partnerships', name: 'Partnerships', category: 'Client-Facing', events: [], color: '#ec4899' },
  { _id: 'consulting', name: 'Consulting', category: 'Client-Facing', events: [], color: '#8b5cf6' },
  { _id: 'finance', name: 'Finance', category: 'Supporting', events: [], color: '#efab45' },
] as const
export type LedgerRow = { _id: string; departmentId: string; event: string; phase: string; name: string; type: 'Expense' | 'Revenue'; amount: number; status: string }
export type YearData = { _id: string; allocations: Record<string, number>; rows: LedgerRow[]; eventAllocations?: Record<string, number> }
export const phases = ['Workshop 1', 'Workshop 2', 'Workshop 3', 'Workshop 4', 'Challenge Gala', 'Final Gala']
export function freshYear(year: string): YearData { return { _id: year, allocations: Object.fromEntries(departments.map(d => [d._id, 0])), rows: [] } }
function seed(year: string): YearData {
 const data = freshYear(year); const factor = year === '2023' ? .65 : year === '2024' ? .74 : year === '2025' ? .82 : 1
 const funds = [3000,2750,2250,2000,400,250,350,650,350,300,200]
 const previousFunds = [18000,15000,14000,12000,6500,4500,5000,10000,6500,5000,3500]
 data.eventAllocations = {}
 departments.forEach((d,i) => {
 data.allocations[d._id] = Math.round(funds[i]*factor)
 d.events.forEach((event,e)=>{data.eventAllocations![`${d._id}:${event}`]=Math.round(data.allocations[d._id]*(d._id==='ventures'?(e===0?.6:.4):1/d.events.length))})
 const events = d.events.length ? [...d.events] : ['Operations']
 events.forEach((event,e) => (event === 'Idea Up' ? phases : ['Overview']).forEach((phase,p) => {
 ;['Venue','Logistics','Flyers','Roll-ups','Catering'].forEach((name,k) => data.rows.push({_id:`${year}-${i}-${e}-${p}-${k}`,departmentId:d._id,event,phase,name,type:'Expense',amount:Math.round((280+i*33+e*90+k*74)*factor*funds[i]/previousFunds[i]/(event==='Idea Up'?3:1)),status:k===4?'Pending':'Paid'}))
 if(d.category!=='Supporting') data.rows.push({_id:`${year}-${i}-${e}-${p}-r`,departmentId:d._id,event,phase,name:'Ticket sales & sponsorships',type:'Revenue',amount:Math.round((1900+i*210)*factor*funds[i]/previousFunds[i]/(event==='Idea Up'?3:1)),status:'Received'})
 }))
 }); return data
}
export const mockData: Record<string,YearData> = {'2023':seed('2023'),'2024':seed('2024'),'2025':seed('2025'),'2026':seed('2026')}

// Upgrade earlier local mock figures while retaining entries and event assignments.
export function migrateStatistics(previous: Record<string, YearData>): Record<string, YearData> {
 const next = {...previous}
 for (const year of ['2025','2026']) {
  const old = previous[year]; if (!old) { next[year]=mockData[year]; continue }
  const target = mockData[year]
  const ratio = (id:string) => old.allocations[id] ? target.allocations[id]/old.allocations[id] : 0
  next[year] = {...old, allocations: {...target.allocations}, rows: old.rows.map(r=>({...r,amount:Math.round(r.amount*ratio(r.departmentId))})), eventAllocations: {...target.eventAllocations,...Object.fromEntries(Object.entries(old.eventAllocations||{}).map(([key,value])=>[key,Math.round(value*ratio(key.split(':')[0]))]))}}
 }
 return next
}
