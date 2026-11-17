import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata={
  title:'Administration | Aquamazone Adventure',
  robots:{index:false,follow:false,noarchive:true}
};
export default function AdminLayout({children}:{children:React.ReactNode}) {
  return <div className="az-admin-root">{children}</div>;
}
