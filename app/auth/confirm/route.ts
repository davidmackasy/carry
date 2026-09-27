import {supabase} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';
export async function GET(request:Request){
 const url=new URL(request.url);const token=url.searchParams.get('token_hash');const type=url.searchParams.get('type');
 if(token&&(type==='signup'||type==='recovery'||type==='email')){const client=await supabase();const {error}=await client.auth.verifyOtp({token_hash:token,type});if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/auth/reset':'/',url.origin));}
 return NextResponse.redirect(new URL('/auth/login?message=This+link+has+expired.+Please+try+again.',url.origin));
}
