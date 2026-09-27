'use server';
import {supabase} from '@/lib/supabase/server';
import {safeReturn} from '@/app/chatgpt-auth';
import {redirect} from 'next/navigation';
function message(text:string):never{redirect('/auth/login?message='+encodeURIComponent(text));}
function credentials(form:FormData){const email=String(form.get('email')??'').trim();const password=String(form.get('password')??'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<8||password.length>128)message('Enter a valid email and a password of 8–128 characters.');return {email,password};}
export async function login(form:FormData){const input=credentials(form);const client=await supabase();const {error}=await client.auth.signInWithPassword(input);if(error)message('Sign-in failed. Check your details and confirm your email.');redirect(safeReturn(String(form.get('next')??'/')));}
export async function signup(form:FormData){const input=credentials(form);const client=await supabase();const {data,error}=await client.auth.signUp(input);if(error)message('Could not create your account. Please try again.');if(data.session)redirect('/');message('Check your email to confirm your account, then sign in.');}
export async function forgotPassword(form:FormData){const email=String(form.get('email')??'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)message('Enter your email address first.');const client=await supabase();await client.auth.resetPasswordForEmail(email);message('If an account exists, a password-reset email is on its way.');}
