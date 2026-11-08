import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Aquamazone Adventure | La détente au fil de l’eau',description:'Base de loisirs nautiques à Adounko Village, Route des Pêches, Cotonou.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="fr"><body>{children}</body></html>}
