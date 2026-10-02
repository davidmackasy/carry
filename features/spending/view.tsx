'use client';
import Bucket from '@/features/lifestyle/bucket';
import {useState} from 'react';
import {Leaf,Car,Coffee,Search,ArrowUpRight,CalendarRange,History} from 'lucide-react';
import type {FinanceState} from '@/types/finance';
import {money,rollBudgetPeriod,summarize} from '@/services/finance';
import {Empty,Meter,Section} from '@/components/carry/shared';

const cycleLabel=(cycle:FinanceState['budgetCycle'])=>cycle==='biweekly'?'Every two weeks':cycle==='custom'?'Custom repeating period':'Monthly';
const resultLabel=(spent:number,budget:number)=>spent>budget?`${money(spent-budget,2)} over`:spent===budget?'Right on plan':`${money(budget-spent,2)} under`;

export default function Spending({state,open,save}:{save:(s:FinanceState)=>Promise<boolean>;state:FinanceState;open:(type:string,id?:string)=>void}){
 const [selected,setSelected]=useState<string|null>(null);
 const [query,setQuery]=useState('');
 const current=rollBudgetPeriod(state);
 const data=summarize(current);
 const currentSpent=data.categories.reduce((sum,c)=>sum+c.spent,0);
 const currentBudget=current.categories.reduce((sum,c)=>sum+c.budget,0);
 const history=[...(current.budgetHistory??[])].reverse();
 const transactions=current.transactions.filter(t=>(t.merchant+' '+t.note+' '+current.categories.find(c=>c.id===t.categoryId)?.name).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));
 if(selected&&current.categories.some(c=>c.id===selected))return <Bucket state={current} id={selected} save={save} back={()=>setSelected(null)} edit={()=>open('category',selected)}/>;
 return <div className="gift-page gift-spending">
  <section className="card spending-total spending-period-card">
   <div><span className="eyebrow"><CalendarRange size={14}/> CURRENT {cycleLabel(current.budgetCycle).toUpperCase()} BUDGET</span><strong>{money(currentSpent,2)} <small>of {money(currentBudget)}</small></strong><p className="subtle">{current.periodStart} — {current.periodEnd} · Resets after this period</p></div>
   <button className="text-action" onClick={()=>open('period')}>Change timing <ArrowUpRight size={15}/></button>
  </section>
  {history[0]&&<section className={'period-result '+(history[0].totalSpent>history[0].totalBudget?'over':'')}><History size={18}/><div><b>Last period: {resultLabel(history[0].totalSpent,history[0].totalBudget)}</b><span>{money(history[0].totalSpent,2)} spent of {money(history[0].totalBudget,2)} planned · {history[0].start} — {history[0].end}</span></div></section>}
  <div className="gift-page-tip">🌿 This period’s spending restarts at zero automatically. Your limits, receipts, and past results stay saved.</div>
  <Section title="Your buckets" action="Add bucket" onAction={()=>open('category')}/>
  <div className="bucket-grid">{data.categories.map((c,i)=><button className="card bucket-card" key={c.id} onClick={()=>setSelected(c.id)}><div className="flex-between"><span className="item-icon">{i===0?<Leaf size={20}/>:i===1?<Car size={20}/>:<Coffee size={20}/>}</span><ArrowUpRight size={16}/></div><h3>{c.name}</h3><p><strong>{money(c.spent)}</strong> <span>/ {money(c.budget)}</span></p><Meter value={c.ratio*100}/><p className="subtle">{money(c.daily,2)}/day remaining</p><span className={'status '+(/HOT|GONE|EXHAUSTED/.test(c.status)?'warning':'')}>{c.status}</span></button>)}</div>
  {!current.categories.length&&<Empty title="A place for everyday spending" action="Add your first bucket" onAction={()=>open('category')}>Set aside money for groceries, gas, and the things you enjoy.</Empty>}
  {history.length>0&&<details className="card budget-history"><summary><span><History size={17}/> Past budget periods</span><small>{history.length} saved</small></summary><div className="budget-history-list">{history.map(period=><article key={period.id}><div><b>{period.start} — {period.end}</b><span>{cycleLabel(period.cycle)}</span></div><div className={period.totalSpent>period.totalBudget?'history-over':''}><strong>{money(period.totalSpent,2)} / {money(period.totalBudget,2)}</strong><span>{resultLabel(period.totalSpent,period.totalBudget)}</span></div>{period.categories.filter(c=>c.spent>c.budget).length>0&&<p>{period.categories.filter(c=>c.spent>c.budget).map(c=>`${c.name} ${money(c.spent-c.budget,2)} over`).join(' · ')}</p>}</article>)}</div></details>}
  <Section title="Transactions" action="Add transaction" onAction={()=>open('transaction')}/>
  <label className="search-box"><Search size={17}/><input aria-label="Search transactions" placeholder="Search merchants, categories, or notes" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <section className="card activity-card">{transactions.map(t=><button className="list-row full-row" key={t.id} onClick={()=>open('transaction',t.id)}><span className="item-icon"><Coffee size={18}/></span><div className="row-copy"><b>{t.merchant}</b><small>{t.date} · {t.splits?'Split transaction':current.categories.find(c=>c.id===t.categoryId)?.name}{t.excluded?' · Excluded':''}{t.recurring?' · Recurring':''}</small></div><b>−{money(t.amount,2)}</b></button>)}{!transactions.length&&<Empty title="No transactions here yet">Add your spending to keep your budget in the picture.</Empty>}</section>
 </div>;
}
