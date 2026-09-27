import {signout} from './signout';
export default function Signout(){return <main className="startup"><h1>Sign out of Gift?</h1><form action={signout}><button className="primary">Sign out</button></form><a href="/">Back to your budget</a></main>;}
