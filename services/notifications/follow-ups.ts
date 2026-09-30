import type {FinanceState} from '../../types/finance';
import {addDays,daysBetween,money,occurs,upcomingBills,today} from '../finance/index';
export function unconfirmedPaydays(state:FinanceState,date=today(state.timezone)){
 const result=[];
 for(const income of state.income){const age=Math.min(3660,daysBetween(income.date,date));for(let n=1;n<=age;n++){const due=addDays(date,-n);if(occurs(income,due)&&!income.receivedDates?.includes(due))result.push({...income,due,days:-n});}}
 return result.sort((a,b)=>a.due.localeCompare(b.due));
}
export function followUpText(kind:'payday'|'bill',name:string,amount:number,due:string,date:string){
 const days=daysBetween(due,date),when=days===1?'yesterday':`${days} days ago`;
 return kind==='payday'?`${name} · expected ${due} (${when}), estimated ${money(amount,2)}. Did it arrive? Gift doesn’t have a recorded deposit yet. If it arrived, confirm the actual amount. If the date changed, update your income schedule.`:`${name} · due ${due} (${when}), ${money(amount,2)}. Was this paid? Gift doesn’t have a recorded payment yet. If you paid it, mark it paid. If the plan changed, edit or pause the bill.`;
}
export function outstandingUpdates(state:FinanceState,date=today(state.timezone)){
 const settings=state.reminders;if(!settings||settings.followUpEnabled===false)return [];
 return [
 ...(settings.paydayEnabled?unconfirmedPaydays(state,date).map(i=>({kind:'payday' as const,id:i.id,due:i.due,name:i.name,amount:i.amount})):[]),
 ...(settings.billsEnabled&&state.notificationSettings.bills?upcomingBills(state,date,0).map(b=>({kind:'bill' as const,id:b.id,due:b.due,name:b.name,amount:b.amount})):[])
 ].sort((a,b)=>a.due.localeCompare(b.due));
}
export function followUpDigest(state:FinanceState,date=today(state.timezone)){
 const items=outstandingUpdates(state,date);if(!items.length)return null;
 return {id:`follow-up:${date}`,kind:'followup' as const,recordId:'outstanding-updates',due:date,notifyDate:date,amount:0,title:items.length===1?(items[0].kind==='payday'?'Did your paycheck arrive?':'A quick check on your bill'):`A quick check on ${items.length} budget updates`,body:`A little check-in to keep your plan accurate. These items are still unconfirmed in Gift:\n\n${items.slice(0,20).map(i=>followUpText(i.kind,i.name,i.amount,i.due,date)).join('\n\n')}${items.length>20?`\n\nPlus ${items.length-20} more items to review in Gift.`:''}\n\nAlready taken care of? Record it in Gift and its follow-ups will stop. Nothing is added to your balance or marked paid automatically. You can turn off daily follow-ups in reminder settings.`};
}
