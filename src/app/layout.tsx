import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BD E-Commerce BI & Courier Analytics',
  description: 'Multi-tenant SaaS BI platform connecting WooCommerce, Shopify, Pathao, Steadfast, and RedX for Bangladeshi Merchants.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
