import Carry from '@/features/home/carry';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/');return <Carry/>;}
