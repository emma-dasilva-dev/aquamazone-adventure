import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: 'Aquamazone Adventure | La détente au fil de l’eau',
    template: '%s | Aquamazone Adventure',
  },
  description:
    'Base de loisirs nautiques à Adounko Village, Route des Pêches, Cotonou, Bénin. Pédalo, canoë-kayak, paddle, balades sur le lac et forfaits.',
  keywords: [
    'Aquamazone Adventure',
    'Aquamazone',
    'base nautique Cotonou',
    'Adounko',
    'Route des Pêches',
    'activités nautiques Bénin',
    'loisirs Cotonou',
  ],
  icons: {
    icon: [
      {
        url: '/aquamazone-tab-v4.ico',
        type: 'image/x-icon',
        sizes: 'any',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_BJ',
    alternateLocale: ['en_US'],
    siteName: 'Aquamazone Adventure',
    title: 'Aquamazone Adventure | La détente au fil de l’eau',
    description:
      'Activités nautiques, détente et découvertes naturelles à Adounko, Cotonou.',
    images: [
      {
        url: '/images/hero/hero.jpg',
        width: 1600,
        height: 900,
        alt: 'Aquamazone Adventure à Adounko, Cotonou',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aquamazone Adventure | La détente au fil de l’eau',
    description:
      'Activités nautiques, détente et découvertes naturelles à Adounko, Cotonou.',
    images: ['/images/hero/hero.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#062047',
};

const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TouristAttraction',
  name: 'Aquamazone Adventure',
  description:
    'Base de loisirs nautiques à Adounko Village, Route des Pêches, Cotonou, Bénin.',
  slogan: 'La détente au fil de l’eau.',
  url: siteUrl,
  telephone: '+229 01 54 28 44 44',
  email: 'aquamazone229@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Village Adounko, Route des Pêches',
    addressLocality: 'Cotonou',
    addressCountry: 'BJ',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'PublicHolidays'],
      opens: '11:00',
      closes: '18:00',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
      </body>
    </html>
  );
}
