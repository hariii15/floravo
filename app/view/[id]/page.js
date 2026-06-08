'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const BASE_SIZE = 200;
const BG_SIZE = 320;

export default function ViewBouquetPage() {
  const params = useParams();
  const id = params.id;
  const [bouquet, setBouquet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchBouquet = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiHost}/api/bouquets/${id}`);
        const data = await response.json();
        if (data.success) {
          setBouquet(data.bouquet);
        } else {
          setError(data.error || 'Failed to fetch bouquet.');
        }
      } catch (err) {
        console.error('Error fetching bouquet:', err);
        setError('Could not connect to the backend server.');
      } finally {
        setLoading(false);
      }
    };
    fetchBouquet();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment-bg)' }}>
        <span className="font-typewriter text-sepia" style={{ fontSize: '0.9rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
          Delivering your bouquet…
        </span>
      </div>
    );
  }

  if (error || !bouquet) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment-bg)', padding: 20 }}>
        <span className="font-typewriter" style={{ fontSize: '1.2rem', color: 'var(--postal-red)', marginBottom: 16 }}>
          Oops! Delivery Failed
        </span>
        <span className="font-typewriter text-sepia" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
          {error || 'The requested bouquet could not be found.'}
        </span>
      </div>
    );
  }

  const { noteRecipient, noteSender, noteText, arranged, polaroidImage, voiceNote } = bouquet;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--parchment-bg)', padding: '40px 20px' }}>
      
      {/* Decorative Title */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 className="font-script" style={{ fontSize: '3.2rem', color: 'var(--ink-brown)', margin: 0 }}>
          A Special Correspondence
        </h1>
        <p className="font-typewriter" style={{ fontSize: '0.65rem', color: 'var(--sepia-light)', textTransform: 'uppercase', letterSpacing: '3px', marginTop: 8 }}>
          — Sent via Floravo Atelier —
        </p>
      </div>

      {/* Main Showcase Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, width: '100%' }}>
        
        {/* Canvas Display */}
        <div style={{ position: 'relative', width: 560, height: 640, background: '#f9f0dc', border: '1px solid var(--parchment-deep)', boxShadow: '0 12px 36px rgba(0,0,0,0.12)' }}>
          
          {/* Render Arranged Flowers */}
          {[...arranged].sort((a, b) => a.layer - b.layer).map((item) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: item.x - (item.isBg ? BG_SIZE : BASE_SIZE) * item.scale / 2,
                top: item.y - (item.isBg ? BG_SIZE : BASE_SIZE) * item.scale / 2,
                width: (item.isBg ? BG_SIZE : BASE_SIZE) * item.scale,
                height: (item.isBg ? BG_SIZE : BASE_SIZE) * item.scale,
                zIndex: item.layer,
                transform: `rotate(${item.rotation}deg)`,
                pointerEvents: 'none',
              }}
            >
              <img src={`/flowers/${item.flower.file}`} alt={item.flower.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ))}

          {/* Note Card overlay */}
          {noteText && (
            <div style={{ position: 'absolute', bottom: 30, left: 20, zIndex: 100, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}>
              <div style={{ background: '#fdf6e3', width: 220, height: 130, padding: 16, border: '1px solid #e0d5c1', overflow: 'hidden' }}>
                <div className="font-typewriter" style={{ fontSize: '0.8rem', color: '#5c4d3c', fontWeight: 'bold', marginBottom: 8 }}>
                  Dear {noteRecipient},
                </div>
                <div className="font-typewriter" style={{ fontSize: '0.75rem', color: '#5c4d3c', lineHeight: 1.5, wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {noteText.split('\n').slice(0, 4).join('\n')}
                </div>
                <div className="font-typewriter" style={{ fontSize: '0.75rem', color: '#5c4d3c', fontWeight: 'bold', marginTop: 8, textAlign: 'right' }}>
                  Sincerely, {noteSender}
                </div>
              </div>
            </div>
          )}

          {/* Polaroid image overlay */}
          {polaroidImage && (
            <div style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 101, transform: 'rotate(8deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.25))' }}>
              <div style={{ background: 'white', width: 160, height: 190, padding: '12px 12px 40px 12px' }}>
                <img src={polaroidImage} alt="Polaroid" style={{ width: '100%', height: 136, objectFit: 'cover', background: '#e0e0e0', filter: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(0.9) hue-rotate(-5deg)' }} />
              </div>
            </div>
          )}

          {/* Audio attached badge */}
          {voiceNote && (
            <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 102, transform: 'rotate(4deg)' }}>
              <div style={{ background: '#fff7e8', border: '1px solid #d5c29f', padding: '8px 12px', boxShadow: '0 8px 18px rgba(0,0,0,0.14)', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', letterSpacing: '1px', color: '#5c4d3c' }}>
                VOICE NOTE ATTACHED
              </div>
            </div>
          )}
        </div>

        {/* Audio Player and Message Detail Box */}
        {voiceNote && (
          <div style={{ width: '100%', maxWidth: 450, background: 'rgba(255,255,255,0.6)', border: '1px solid var(--parchment-deep)', padding: '18px 24px', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="font-typewriter" style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--sepia-light)' }}>
              ▶ Listen to Voice Message
            </span>
            <audio controls src={voiceNote} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      {/* Back to Home / Create Your Own button */}
      <div style={{ marginTop: 48 }}>
        <a href="/" style={{
          display: 'inline-block',
          padding: '12px 32px',
          border: '1px solid black',
          textDecoration: 'none',
          color: 'black',
          background: 'transparent',
          fontFamily: 'var(--font-typewriter)',
          fontSize: '0.8rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
        }}>
          Create Your Own Bouquet
        </a>
      </div>

    </div>
  );
}
