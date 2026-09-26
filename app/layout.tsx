import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Carry — Your money, a little clearer',description:'Know how far your money can carry you. Plan bills, spending and savings in one calm place.',manifest:'/manifest.json',icons:{icon:'/favicon.svg',apple:'/icon-192.png'},appleWebApp:{capable:true,statusBarStyle:'default',title:'Carry'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f7f7f5'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
