import Landing from '@/features/marketing/landing';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <Landing signedIn={Boolean(user)}/>;}
