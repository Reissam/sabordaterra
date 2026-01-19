import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Cardápio Virtual',
  description: 'Sabor da Terra - Cardápio Virtual',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}


