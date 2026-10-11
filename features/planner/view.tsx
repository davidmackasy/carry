'use client';
import {ArrowRight,CalendarRange,CheckCircle2,CircleDollarSign,Flag,Lightbulb,ReceiptText,TrendingUp,Wallet} from 'lucide-react';
import Image from 'next/image';
import type {FinanceState} from '@/types/finance';
import {money} from '@/services/finance';
import {buildBudgetPlan} from '@/services/finance/planner';

const percent=(value:number,total:number)=>Math.min(100,Math.round(value/Math.max(1,total)*100));
const periodLabel=(start:string,end:string)=>`${new Date(start+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${new Date(end+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;

export default function Planner({state,navigate,open}:{state:FinanceState;navigate:(tab:string)=>void;open:(type:string,id?:string)=>void}){
 const plan=buildBudgetPlan(state);
 const allocation=[
  {label:'Bills',value:plan.bills.planned,icon:ReceiptText,tone:'blush'},
  {label:'Everyday spending',value:plan.spending.planned,icon:Wallet,tone:'sage'},
  {label:'Savings goals',value:plan.goals.planned,icon:Flag,tone:'peach'},
 ];
 const action=(kind:typeof plan.guidance[number]['action'])=>kind==='income'?open('paydays'):navigate(kind==='bills'?'Bills':kind==='spending'?'Spending':'Goals');
 return <div className="gift-page gift-planner">
  <section className="planner-hero">
   <div><span className="eyebrow"><CalendarRange size={14}/> YOUR LIVE PLAN · {periodLabel(plan.period.start,plan.period.end)}</span><h2>Every dollar, thoughtfully planned.</h2><p>Gift organizes your expected income across bills, everyday spending, and goals—then tracks what actually happens.</p></div>
   <div className="planner-hero-total"><span>Projected cash after this plan</span><strong>{money(plan.projectedCash,2)}</strong><small>{plan.projectedCash>=plan.protectedMinimum?`${money(plan.projectedCash-plan.protectedMinimum,2)} above your protected buffer`:`${money(plan.protectedMinimum-plan.projectedCash,2)} below your protected buffer`}</small></div>
   <div className="planner-mascot"><Image src="/images/gigi-mascot.png" width={284} height={320} sizes="(max-width: 700px) 120px, 180px" alt="Gigi, Gift’s friendly planning guide" priority/><span>Meet Gigi, your planning guide.</span></div>
  </section>
  <div className="planner-period-progress"><div className="flex-between"><span>{plan.period.elapsed} of {plan.period.total} days</span><b>{Math.round(plan.period.progress*100)}% through this period</b></div><progress max="100" value={plan.period.progress*100}/></div>
  <section className="planner-balance-grid">
   <article className="planner-income"><span><TrendingUp size={18}/>Expected income</span><strong>{money(plan.income.planned,2)}</strong><small>{money(plan.income.received,2)} confirmed received</small><div className="planner-meter"><i style={{width:`${percent(plan.income.received,plan.income.planned)}%`}}/></div><button onClick={()=>open('paydays')}>Manage income <ArrowRight size={14}/></button></article>
   <article className="planner-outflow"><span><CircleDollarSign size={18}/>Planned outflow</span><strong>{money(plan.plannedOutflow,2)}</strong><small>{money(Math.max(0,plan.plannedRemainder),2)} unassigned from expected income</small><div className="planner-allocation-bar" aria-label="Planned allocation">{allocation.filter(item=>item.value>0).map(item=><i key={item.label} className={item.tone} style={{width:`${Math.max(2,percent(item.value,plan.plannedOutflow))}%`}}/>)}</div><button onClick={()=>navigate('Spending')}>Adjust the plan <ArrowRight size={14}/></button></article>
  </section>
  <section className="planner-section"><div className="planner-section-heading"><div><span className="eyebrow">YOUR MONEY MAP</span><h2>Where the plan is going</h2></div><span>{money(plan.plannedOutflow,2)} planned</span></div><div className="planner-allocation-grid">{allocation.map(({label,value,icon:Icon,tone})=><button className={`planner-allocation ${tone}`} key={label} onClick={()=>navigate(label==='Bills'?'Bills':label==='Everyday spending'?'Spending':'Goals')}><span><Icon size={19}/>{label}</span><strong>{money(value,2)}</strong><small>{percent(value,plan.plannedOutflow)}% of planned outflow</small><ArrowRight size={15}/></button>)}</div></section>
  <section className="planner-section"><div className="planner-section-heading"><div><span className="eyebrow">AUTOMATIC TRACKING</span><h2>Plan versus actual</h2></div><span>Updates as you record activity</span></div><div className="planner-track-grid"><Track icon={ReceiptText} label="Bills paid" actual={plan.bills.paid} planned={plan.bills.planned}/><Track icon={Wallet} label="Everyday spending" actual={plan.spending.spent} planned={plan.spending.planned}/><Track icon={Flag} label="Goals saved" actual={plan.goals.saved} planned={plan.goals.target} lifetime/></div></section>
  {!!plan.categories.length&&<section className="planner-section"><div className="planner-section-heading"><div><span className="eyebrow">SPENDING PACE</span><h2>Keep this period comfortable</h2></div><button onClick={()=>navigate('Spending')}>See all <ArrowRight size={14}/></button></div><div className="planner-category-list">{plan.categories.map(category=><button key={category.id} onClick={()=>navigate('Spending')}><span><b>{category.name}</b><small>{category.status==='over'?'Over budget':category.status==='watch'?'Moving faster than planned':'On track'}</small></span><div><strong>{money(category.spent,2)} / {money(category.budget,2)}</strong><progress max="100" value={Math.min(100,category.pace*100)}/></div></button>)}</div></section>}
  <section className="planner-guidance"><div className="planner-guidance-heading"><span><Lightbulb size={20}/></span><div><p className="eyebrow">GIFT PLAN CHECK-IN</p><h2>What to do next</h2></div></div>{plan.guidance.map(item=><button className={item.tone} key={item.title} onClick={()=>action(item.action)}><span>{item.tone==='good'?<CheckCircle2 size={18}/>:<CircleDollarSign size={18}/>}</span><div><b>{item.title}</b><small>{item.detail}</small></div><ArrowRight size={16}/></button>)}<p>Plans are estimates based on what you save in Gift. Expected deposits stay projected until you confirm they arrived.</p></section>
 </div>;
}

function Track({icon:Icon,label,actual,planned,lifetime=false}:{icon:typeof ReceiptText;label:string;actual:number;planned:number;lifetime?:boolean}){const progress=percent(actual,planned);return <article><div className="flex-between"><span><Icon size={18}/>{label}</span><b>{progress}%</b></div><strong>{money(actual,2)}</strong><small>{lifetime?'of your total goal targets':`of ${money(planned,2)} planned`}</small><progress max="100" value={progress}/></article>}
