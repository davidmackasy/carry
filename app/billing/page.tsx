import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Billing from './view';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/billing');return <Billing/>;}
