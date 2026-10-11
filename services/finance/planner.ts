import type {FinanceState} from '@/types/finance';
import {addDays,balance,categorySpent,daysBetween,money,occurs,rollBudgetPeriod,today} from './index';

const dates=(start:string,end:string)=>Array.from({length:Math.max(0,daysBetween(start,end)+1)},(_,index)=>addDays(start,index));

export type BudgetPlan={
 period:{start:string;end:string;elapsed:number;total:number;progress:number};
 income:{planned:number;received:number;remaining:number};
 bills:{planned:number;paid:number;remaining:number};
 spending:{planned:number;spent:number;remaining:number};
 goals:{planned:number;saved:number;target:number};
 plannedOutflow:number;
 plannedRemainder:number;
 currentCash:number;
 projectedCash:number;
 protectedMinimum:number;
 categories:{id:string;name:string;budget:number;spent:number;remaining:number;pace:number;status:'on_track'|'watch'|'over'}[];
 guidance:{tone:'good'|'watch'|'urgent';title:string;detail:string;action:'income'|'bills'|'spending'|'goals'}[];
};

export function buildBudgetPlan(source:FinanceState,date=today(source.timezone)):BudgetPlan{
 const state=rollBudgetPeriod(source,date),periodDays=dates(state.periodStart,state.periodEnd);
 const total=Math.max(1,periodDays.length),elapsed=Math.min(total,Math.max(1,daysBetween(state.periodStart,date)+1)),progress=Math.min(1,elapsed/total);
 const plannedIncome=periodDays.reduce((sum,day)=>sum+state.income.filter(item=>occurs(item,day)).reduce((a,b)=>a+b.amount,0),0);
 const receipts=(state.incomeReceipts??[]).filter(item=>item.receivedDate>=state.periodStart&&item.receivedDate<=state.periodEnd);
 const receivedIncome=receipts.length?receipts.reduce((sum,item)=>sum+item.amount,0):state.income.reduce((sum,item)=>sum+(item.receivedDates??[]).filter(day=>day>=state.periodStart&&day<=state.periodEnd).length*item.amount,0);
 const plannedBills=periodDays.reduce((sum,day)=>sum+state.bills.filter(item=>!item.paused&&occurs(item,day)).reduce((a,b)=>a+b.amount,0),0);
 const paidBills=state.bills.reduce((sum,item)=>sum+item.paidDates.filter(day=>day>=state.periodStart&&day<=state.periodEnd).length*item.amount,0);
 const plannedSpending=state.categories.reduce((sum,item)=>sum+item.budget,0);
 const spent=state.transactions.filter(item=>!item.excluded&&item.date>=state.periodStart&&item.date<=state.periodEnd).reduce((sum,item)=>sum+item.amount,0);
 const goalTarget=state.goals.reduce((sum,item)=>sum+item.target,0),goalSaved=state.goals.reduce((sum,item)=>sum+item.saved,0);
 const plannedGoals=state.goals.reduce((sum,item)=>sum+Math.min(item.contribution,Math.max(0,item.target-item.saved)),0);
 const plannedOutflow=plannedBills+plannedSpending+plannedGoals,plannedRemainder=plannedIncome-plannedOutflow;
 const remainingIncome=Math.max(0,plannedIncome-receivedIncome),remainingBills=Math.max(0,plannedBills-paidBills),remainingSpending=Math.max(0,plannedSpending-spent);
 const currentCash=balance(state),projectedCash=currentCash+remainingIncome-remainingBills-remainingSpending-plannedGoals;
 const categories=state.categories.map(item=>{const categoryActual=categorySpent(state,item.id),pace=item.budget?categoryActual/item.budget:0,expected=item.budget*progress;return {id:item.id,name:item.name,budget:item.budget,spent:categoryActual,remaining:Math.max(0,item.budget-categoryActual),pace,status:(categoryActual>item.budget?'over':categoryActual>expected*1.15?'watch':'on_track') as 'on_track'|'watch'|'over'};});
 const guidance:BudgetPlan['guidance']=[];
 if(!state.income.length)guidance.push({tone:'urgent',title:'Add your expected income',detail:'Gift needs at least one income schedule to build a complete plan.',action:'income'});
 if(projectedCash<state.protectedMinimum)guidance.push({tone:'urgent',title:'Protect your cash buffer',detail:`This plan projects ${money(Math.max(0,state.protectedMinimum-projectedCash),2)} below your protected minimum.`,action:'spending'});
 const hot=categories.filter(item=>item.status!=='on_track');
 if(hot.length)guidance.push({tone:'watch',title:`Check ${hot[0].name}`,detail:hot[0].status==='over'?'This bucket is over its limit for the current period.':'Spending is moving faster than this period’s pace.',action:'spending'});
 if(plannedRemainder>0)guidance.push({tone:'good',title:'Give the remaining money a job',detail:'Your expected income is higher than planned bills, spending, and goal contributions.',action:'goals'});
 if(!guidance.length)guidance.push({tone:'good',title:'Your plan is in balance',detail:'Planned income covers bills, everyday spending, and goal contributions for this period.',action:'bills'});
 return {period:{start:state.periodStart,end:state.periodEnd,elapsed,total,progress},income:{planned:plannedIncome,received:receivedIncome,remaining:remainingIncome},bills:{planned:plannedBills,paid:paidBills,remaining:remainingBills},spending:{planned:plannedSpending,spent,remaining:remainingSpending},goals:{planned:plannedGoals,saved:goalSaved,target:goalTarget},plannedOutflow,plannedRemainder,currentCash,projectedCash,protectedMinimum:state.protectedMinimum,categories,guidance};
}
