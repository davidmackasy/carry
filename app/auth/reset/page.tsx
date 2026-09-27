import {resetPassword} from './reset';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Reset({searchParams}:{searchParams:Promise<{message?:string}>}){await requireChatGPTUser('/auth/reset');const params=await searchParams;return <main className="startup"><h1>Choose a new password</h1>{params.message&&<p role="alert">{params.message}</p>}<form action={resetPassword}><label className="field">New password<input className="carry-input" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label><button className="primary">Save password</button></form></main>;}
