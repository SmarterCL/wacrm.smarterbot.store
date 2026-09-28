import type { Metadata } from 'next';
import Script from 'next/script';

/**
 * Layout de las páginas legales públicas.
 *
 * El layout raíz declara `robots: index: false` porque el grueso de
 * esta aplicación es un CRM autenticado. Ese valor heredaría a
 * `/privacidad`, `/condiciones` y `/eliminacion`, y Meta exige que
 * la Privacy Policy y la Data Deletion URL sean públicas e indexables
 * — por eso este segmento sobreescribe `robots`.
 *
 * También fuerza emerald + light sin modificar localStorage, para que
 * el usuario del dashboard conserve su preferencia de apariencia.
 */
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const PUBLIC_THEME_SCRIPT = `
(function(){
  var d = document.documentElement;
  d.dataset.theme = 'emerald';
  d.dataset.mode  = 'light';
})();
`;

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="public-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: PUBLIC_THEME_SCRIPT }} />
      {children}
    </>
  );
}
