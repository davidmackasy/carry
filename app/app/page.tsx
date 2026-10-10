import { requireChatGPTUser } from '@/app/chatgpt-auth';
import Carry from '@/features/home/carry';
import {currentAdmin} from '@/lib/admin/access';

export const dynamic = 'force-dynamic';

export default async function AppPage() {
  await requireChatGPTUser('/app');
  return <Carry admin={!!(await currentAdmin())} />;
}
