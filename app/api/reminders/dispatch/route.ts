import {emailConfig} from '@/lib/email-config';
import {dispatchReminders} from '@/services/notifications/dispatch';
export const dynamic='force-dynamic';
async function authorized(header:string|null,secret:string){const encoder=new TextEncoder();const hashes=await Promise.all([header??'','Bearer '+secret].map(s=>crypto.subtle.digest('SHA-256',encoder.encode(s))));let difference=0;const a=new Uint8Array(hashes[0]),b=new Uint8Array(hashes[1]);for(let i=0;i<a.length;i++)difference|=a[i]^b[i];return difference===0;}
export async function POST(request:Request){
 const config=emailConfig();
 if(!config.secret||!await authorized(request.headers.get('authorization'),config.secret))return Response.json({error:'Unauthorized'},{status:401});
 return dispatchReminders();
}
