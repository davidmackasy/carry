import {brand} from '@/lib/brand';
import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={
  metadataBase:new URL(brand.primaryUrl),
  title:brand.title,
  description:brand.description,
  alternates:{canonical:'/'},
  openGraph:{type:'website',url:'/',siteName:brand.name,title:brand.name,description:brand.tagline},
  twitter:{card:'summary',title:brand.name,description:brand.tagline},
  manifest:'/manifest.json',
  icons:{icon:'/favicon.svg',apple:'/icon-192.png'},
  appleWebApp:{capable:true,statusBarStyle:'default',title:brand.name}
};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f7f7f5'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
