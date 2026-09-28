import AuthForm from '../form';
import {safeNext} from '@/lib/auth/http';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{message?:string;next?:string}>}){const p=await searchParams;return <AuthForm mode="login" next={safeNext(p.next)} initialMessage={p.message}/>;}
