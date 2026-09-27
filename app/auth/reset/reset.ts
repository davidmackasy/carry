'use server';
import {supabase} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
export async function resetPassword(form:FormData){const password=String(form.get('password')??'');if(password.length<8||password.length>128)redirect('/auth/reset?message=Use+8–128+characters.');const client=await supabase();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/auth/login');const {error}=await client.auth.updateUser({password});if(error)redirect('/auth/reset?message=Could+not+save.+Please+retry.');redirect('/');}
