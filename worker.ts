import handler from 'vinext/server/fetch-handler';
import {dispatchReminders} from './services/notifications/dispatch';
export default {
 fetch:handler.fetch,
 async scheduled(){
  const response=await dispatchReminders();
  if(!response.ok)throw new Error('Gift reminder job failed; check sender and storage configuration.');
 }
};
