'use server';
import {supabase} from '@/lib/supabase/server';
import {redirect} from 'next/navigation';
export async function signout(){const client=await supabase();await client.auth.signOut();redirect('/auth/login');}
