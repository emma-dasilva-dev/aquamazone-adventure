import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aquamazone Adventure | La détente au fil de l’eau',
  description:
    'Base de loisirs nautiques à Adounko Village, Route des Pêches, Cotonou.',
  icons: {
    icon: [
      {
        url: '/aquamazone-tab-v3.ico',
        type: 'image/x-icon',
        sizes: 'any',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
