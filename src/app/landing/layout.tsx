import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmarterCRM — CRM + WhatsApp + IA',
  description:
    'Automatiza ventas, atención y seguimiento con WhatsApp, CRM e Inteligencia Artificial.',
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
