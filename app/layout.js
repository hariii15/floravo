import './globals.css';

export const metadata = {
  title: 'Royal Bouquet Atelier — Floral Design Studio',
  description: 'Craft exquisite bouquets with our curated flower inventory. A vintage-inspired floral design studio.',
  keywords: 'bouquet builder, floral design, flower arrangement, AI bouquet',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="parchment-bg">
        {children}
      </body>
    </html>
  );
}