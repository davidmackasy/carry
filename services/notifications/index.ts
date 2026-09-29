import type {FinanceState} from '../../types/finance';
import {addDays,daysBetween,money,occurs,today,upcomingBills,categorySpent} from '../finance/index';
export const reminderDefaults={paydayEnabled:true,paydayDays:2,billsEnabled:true,billDays:3,emailEnabled:false,sendHour:9,smartEnabled:false};
export type Reminder={id:string;kind:'payday'|'bill'|'budget'|'restock';title:string;body:string;due:string;notifyDate:string;amount:number;recordId:string};
export function upcomingPaydays(s:FinanceState,date=today(s.timezone),horizon=45){const result=[];for(let n=0;n<horizon;n++){const day=addDays(date,n);for(const i of s.income)if(occurs(i,day)&&!i.receivedDates?.includes(day))result.push({...i,due:day,days:n});}return result;}
export function remindersFor(s:FinanceState,date=today(s.timezone),horizon=30):Reminder[]{const settings=s.reminders??reminderDefaults;const reminders:Reminder[]=[];
 if(settings.paydayEnabled)for(const i of upcomingPaydays(s,date,horizon)){const upcoming=upcomingBills(s,i.due,7).filter(b=>b.days>=0);const bills=upcoming.reduce((a,b)=>a+b.amount,0);reminders.push({id:`payday:${i.id}:${i.due}`,recordId:i.id,kind:'payday',title:`${i.name} ${i.days===0?'is expected today':`is expected in ${i.days} day${i.days===1?'':'s'}`}`,body:`Estimated take-home pay: ${money(i.amount,2)}${i.employer?` from ${i.employer}`:''}. ${money(bills,2)} in tracked bills fall in the following seven days. This is your estimate, not a confirmed deposit.`,due:i.due,notifyDate:addDays(i.due,-settings.paydayDays),amount:i.amount});}
 if(settings.billsEnabled&&s.notificationSettings.bills)for(const b of upcomingBills(s,date,horizon)){reminders.push({id:`bill:${b.id}:${b.due}`,recordId:b.id,kind:'bill',title:`${b.name} ${b.days<0?'is overdue':b.days===0?'is due today':`is due in ${b.days} day${b.days===1?'':'s'}`}`,body:`${money(b.amount,2)} due ${b.due}. Record the payment after you’ve made it.`,due:b.due,notifyDate:addDays(b.due,-settings.billDays),amount:b.amount});}
 if(settings.smartEnabled){
 if(s.notificationSettings.budget&&date>=s.periodStart&&date<=s.periodEnd)for(const c of s.categories){const spent=categorySpent(s,c.id);if(c.budget>0&&spent>=c.budget*.9){const tier=spent>=c.budget?'over':'near';reminders.push({id:`budget:${c.id}:${s.periodStart}:${tier}`,recordId:c.id,kind:'budget',title:`${c.name}: ${tier==='over'?'your budget needs a look':'close to your budget'}`,body:`You’ve recorded ${money(spent,2)} of your ${money(c.budget,2)} budget for ${s.periodStart}–${s.periodEnd}. Review your spending or adjust the plan if your needs have changed.`,due:date,notifyDate:date,amount:spent});}}
 const history=new Map<string,{name:string;categoryId:string;dates:string[]}>();
 for(const t of s.transactions.filter(t=>!t.excluded&&t.date<=date))for(const i of t.items??[]){const key=t.categoryId+':'+i.name.trim().toLowerCase().replace(/\s+/g,' ');const h=history.get(key)??{name:i.name,categoryId:t.categoryId,dates:[]};if(!h.dates.includes(t.date))h.dates.push(t.date);history.set(key,h);}
 let restockCount=0;for(const [key,h] of history){if(restockCount>=2)break;if(h.dates.length<3)continue;const dates=h.dates.sort().slice(-6);const gaps=dates.slice(1).map((d,i)=>daysBetween(dates[i],d));const typical=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);if(typical<3||typical>60||gaps.some(g=>Math.abs(g-typical)>typical*.5))continue;const expected=addDays(dates.at(-1)!,typical);if(expected!==date)continue;restockCount++;reminders.push({id:`restock:${key}:${dates.at(-1)}`,recordId:h.categoryId,kind:'restock',title:`Time to check ${h.name}?`,body:`Your saved receipts show you usually buy ${h.name} about every ${typical} days. You may still have enough—check before adding it to your list. Gift can’t see what is in your pantry.`,due:date,notifyDate:date,amount:0});}
 }
 return reminders.sort((a,b)=>a.notifyDate.localeCompare(b.notifyDate));
}
export const dueReminders=(s:FinanceState,date=today(s.timezone))=>remindersFor(s,date,15).filter(r=>r.notifyDate===date);
export function confirmPaycheck(s:FinanceState,incomeId:string,scheduledDate:string,amount:number,accountId:string,receivedDate=today(s.timezone)):FinanceState{
 const income=s.income.find(i=>i.id===incomeId);if(!income||!occurs(income,scheduledDate))throw new Error('Choose a scheduled paycheck.');
 if(income.receivedDates?.includes(scheduledDate))throw new Error('This paycheck was already recorded.');
 if(!Number.isSafeInteger(amount)||amount<0)throw new Error('Enter the actual amount received.');
 if(receivedDate>today(s.timezone))throw new Error('Only record income that has already arrived.');
 if(!s.accounts.some(a=>a.id===accountId))throw new Error('Choose the account that received this income.');
 return {...s,accounts:s.accounts.map(a=>a.id===accountId?{...a,balance:a.balance+amount}:a),income:s.income.map(i=>i.id===incomeId?{...i,receivedDates:[...(i.receivedDates??[]),scheduledDate]}:i),incomeReceipts:[...(s.incomeReceipts??[]),{id:`${incomeId}:${scheduledDate}`,incomeId,scheduledDate,receivedDate,amount,accountId}]};
}
export type MoneyEvent={id:string;recordId:string;kind:'bill'|'payday';name:string;date:string;days:number;amount:number};
export function nextMoneyEvents(s:FinanceState,date=today(s.timezone)):MoneyEvent[]{
 const bills=upcomingBills(s,date,366).map(b=>({id:`bill:${b.id}:${b.due}`,recordId:b.id,kind:'bill' as const,name:b.name,date:b.due,days:b.days,amount:b.amount}));
 const paydays=upcomingPaydays(s,date,366).map(i=>({id:`payday:${i.id}:${i.due}`,recordId:i.id,kind:'payday' as const,name:i.name,date:i.due,days:i.days,amount:i.amount}));
 return [...bills,...paydays].sort((a,b)=>a.days-b.days||(a.kind===b.kind?a.name.localeCompare(b.name):a.kind==='bill'?-1:1)).slice(0,4);
}
