'use client';
import type {ReactNode} from 'react';
import {ArrowRight,Plus} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
export function Field({label,name,value,onChange,type='text',required=true,min,step}:{label:string;name?:string;value?:string|number;onChange?:(v:string)=>void;type?:string;required?:boolean;min?:string|number;step?:string|number}){return <label className="field"><span>{label}</span><Input name={name} value={value} onChange={onChange?e=>onChange(e.target.value):undefined} type={type} required={required} min={min} step={step} className="carry-input"/></label>}
export function Choice({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){return <label className="field"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="carry-input"><SelectValue/></SelectTrigger><SelectContent>{options.map(x=><SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}</SelectContent></Select></label>}
export function Empty({title,children,action,onAction}:{title:string;children:ReactNode;action?:string;onAction?:()=>void}){return <div className="empty-state"><h3>{title}</h3><p>{children}</p>{action&&<button className="primary" onClick={onAction}><Plus size={17}/>{action}</button>}</div>}
export function Section({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}){return <div className="section-heading"><h2>{title}</h2>{action&&<button onClick={onAction}>{action}<ArrowRight size={16}/></button>}</div>}
export function Meter({value}:{value:number}){return <Progress value={Math.max(0,Math.min(100,value))} className="budget-progress"/>}
export const cents=(v:FormDataEntryValue|null|string)=>Math.round(Number(v)*100);
export const uid=()=>crypto.randomUUID();
