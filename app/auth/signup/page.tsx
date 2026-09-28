import AuthForm from '../form';
import {safeNext} from '@/lib/auth/http';
export const dynamic='force-dynamic';
export default async function Signup({searchParams}:{searchParams:Promise<{next?:string}>}){const p=await searchParams;return <AuthForm mode="signup" next={safeNext(p.next)}/>;}
