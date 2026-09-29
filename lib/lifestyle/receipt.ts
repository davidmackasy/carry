export type ReceiptItem={name:string;group:string};
export function receiptDraft(text:string){
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const totals=lines.filter(s=>/\b(grand\s+total|total|amount\s+paid)\b/i.test(s)&&!/sub\s*total|tax|saving/i.test(s));
 const raw=totals.at(-1)?.match(/(\d[\d,]*[.]\d{2})(?!.*\d[.]\d{2})/)?.[1];
 const items=lines.filter(s=>/\d[.]\d{2}\s*$/.test(s)&&!/(total|tax|change|cash|visa|mastercard|balance|saving|tender)/i.test(s)).slice(0,80).map(s=>({name:s.replace(/\s+\$?\d[\d,]*[.]\d{2}\s*$/,'').slice(0,100),group:'Other'})).filter(i=>i.name);
 return {merchant:lines[0]?.slice(0,100)??'',amount:raw?raw.replaceAll(',',''):'',items};
}
export const normalizeItem=(name:string)=>name.trim().toLocaleLowerCase().replace(/\s+/g,' ');
