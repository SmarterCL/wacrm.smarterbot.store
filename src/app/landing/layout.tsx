import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SmarterCRM — CRM + WhatsApp + IA',
  description:
    'Automatiza ventas, atención y seguimiento con WhatsApp, CRM e Inteligencia Artificial.',
};

// Fuerza emerald + light en las páginas públicas sin tocar localStorage,
// así el usuario del dashboard mantiene su preferencia intacta.
const PUBLIC_THEME_SCRIPT = `
(function(){
  var d = document.documentElement;
  d.dataset.theme = 'emerald';
  d.dataset.mode  = 'light';
})();
`;

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="public-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: PUBLIC_THEME_SCRIPT }} />
      {children}
    </>
  );
}
