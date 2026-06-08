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
      <body className="parchment-bg" style={{ position: 'relative' }}>
        {children}
        {/* Global Lineart Background Elements */}
        <img src="/flowers/lineart%20left.png" alt="" style={{ position: 'fixed', left: 0, bottom: 0, height: '420px', width: 'auto', objectFit: 'contain', pointerEvents: 'none', zIndex: 0, opacity: 0.9 }} />
        <img src="/flowers/lineart%20right.png" alt="" style={{ position: 'fixed', right: 0, bottom: 0, height: '420px', width: 'auto', objectFit: 'contain', pointerEvents: 'none', zIndex: 0, opacity: 0.9 }} />
      </body>
    </html>
  );
}