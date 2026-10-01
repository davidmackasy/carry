export type SubscriptionOption={id:string;name:string;group:string;frequency:'monthly'|'yearly'};

const names:Record<string,string[]>={
 'TV & movies':['Netflix','Hulu','Disney+','Max','Peacock','Paramount+','Apple TV+','Amazon Prime Video','YouTube TV','Sling TV','Fubo','STARZ','AMC+','Crunchyroll','BritBox','Discovery+','ESPN+'],
 'Music & audio':['Spotify','Apple Music','Amazon Music Unlimited','YouTube Music','Pandora','TIDAL','SiriusXM','Audible','SoundCloud Go+'],
 'Shopping & delivery':['Amazon Prime','Walmart+','Instacart+','DoorDash DashPass','Uber One','Grubhub+','Shipt','Costco membership','Sam’s Club membership'],
 'Cloud & software':['iCloud+','Google One','Microsoft 365','Dropbox','Adobe Creative Cloud','Canva Pro','Notion Plus','ChatGPT Plus','Grammarly Premium','1Password'],
 'Fitness & wellness':['Planet Fitness','LA Fitness','Anytime Fitness','Peloton','Apple Fitness+','Fitbit Premium','Strava','Calm','Headspace','Noom'],
 'Gaming':['Xbox Game Pass','PlayStation Plus','Nintendo Switch Online','EA Play','NVIDIA GeForce NOW','Apple Arcade'],
 'News & reading':['The New York Times','The Washington Post','The Wall Street Journal','Apple News+','Kindle Unlimited','Medium'],
 'Home & security':['Ring Protect','Arlo Secure','Google Nest Aware','ADT','SimpliSafe'],
 'Phone & internet':['Verizon','AT&T','T-Mobile','Xfinity','Spectrum','Cox','Google Fiber'],
};

export const subscriptionCatalog:SubscriptionOption[]=Object.entries(names).flatMap(([group,items])=>items.map(name=>({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''),name,group,frequency:/Costco|Sam’s Club/.test(name)?'yearly':'monthly'})));
export const subscriptionGroups=Object.keys(names);
export function subscriptionOption(id:string){return subscriptionCatalog.find(option=>option.id===id);}
