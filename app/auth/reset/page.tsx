import AuthForm from '../form';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Reset(){await requireChatGPTUser('/auth/reset');return <AuthForm mode="reset"/>;}
