import type { Metadata } from 'next';

/**
 * Layout de las páginas legales públicas.
 *
 * El layout raíz (`src/app/layout.tsx`) declara `robots: index: false`
 * porque el grueso de esta aplicación es un CRM autenticado que no debe
 * aparecer en buscadores. Ese valor heredaría a `/privacidad`,
 * `/condiciones` y `/eliminacion`, y Meta exige que la Privacy Policy y
 * la Data Deletion URL sean públicas e indexables — por eso el grupo
 * sobreescribe `robots` en su propio segmento (Next.js resuelve la
 * metadata del segmento más profundo campo por campo).
 */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
