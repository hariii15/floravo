'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const BASE_SIZE = 200;
const BG_SIZE = 320;

// ── Floral particle for scene 1
function FloralParticle({ style }) {
  const emojis = ['🌸','🌺','🌹','🌼','🌻','💐','🌷'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return (
    <motion.div
      style={{ position: 'absolute', fontSize: `${Math.random() * 2 + 1}rem`, filter: 'blur(2px)', opacity: 0, ...style }}
      animate={{ opacity: [0, 0.4, 0], y: [0, -80], rotate: [0, 30] }}
      transition={{ duration: Math.random() * 4 + 3, repeat: Infinity, delay: Math.random() * 4, ease: 'easeInOut' }}
    >
      {emoji}
    </motion.div>
  );
}

// ── Typewriter hook
function useTypewriter(text, speed = 35, start = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!start || !text) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, start]);
  return { displayed, done };
}

export default function ViewBouquetPage() {
  const params = useParams();
  const id = params.id;
  const [bouquet, setBouquet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scene, setScene] = useState(0); // 0=intro,1=envelope,2=letter,3=vinyl,4=bouquet,5=final
  const [envelopeGone, setEnvelopeGone] = useState(false);
  const [letterLeft, setLetterLeft] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bloomedItems, setBloomedItems] = useState([]);
  const audioRef = useRef(null);
  const particles = useRef(Array.from({ length: 18 }, (_, i) => ({
    left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, key: i
  }))).current;

  const fullLetterText = bouquet ? `Dear ${bouquet.noteRecipient},\n\n${bouquet.noteText}\n\nSincerely,\n${bouquet.noteSender}` : '';
  const { displayed: typedLetter, done: typingDone } = useTypewriter(fullLetterText, 30, scene === 2);

  useEffect(() => {
    if (!id) return;
    const fetchBouquet = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiHost}/api/bouquets/${id}`);
        const data = await res.json();
        if (data.success) setBouquet(data.bouquet);
        else setError(data.error || 'Failed to fetch bouquet.');
      } catch { setError('Could not connect to server.'); }
      finally { setLoading(false); }
    };
    fetchBouquet();
  }, [id]);

  // Auto-advance scene 0 → 1
  useEffect(() => {
    if (scene !== 0 || loading || error) return;
    const t = setTimeout(() => setScene(1), 3200);
    return () => clearTimeout(t);
  }, [scene, loading, error]);

  // Auto advance envelope out after arrival
  useEffect(() => {
    if (scene !== 1) return;
    const t1 = setTimeout(() => setEnvelopeGone(true), 3000);
    const t2 = setTimeout(() => setScene(2), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [scene]);

  // After letter reading, allow continue
  // Scene 3 → vinyl, Scene 4 → bouquet bloom
  useEffect(() => {
    if (scene !== 4 || !bouquet) return;
    const sorted = sortedArranged(bouquet.arranged);
    let delay = 0;
    sorted.forEach((item, i) => {
      delay += i === 0 ? 300 : 250;
      setTimeout(() => setBloomedItems(prev => [...prev, item.id]), delay);
    });
  }, [scene, bouquet]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0f07' }}>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
        style={{ fontFamily: 'var(--font-typewriter)', color: '#d4b97a', letterSpacing: 4, fontSize: '0.9rem' }}>
        Opening the Atelier…
      </motion.p>
    </div>
  );

  if (error || !bouquet) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf6e3' }}>
      <p style={{ fontFamily: 'var(--font-typewriter)', color: 'var(--postal-red)' }}>{error || 'Bouquet not found.'}</p>
    </div>
  );

  const { noteRecipient, noteSender, noteText, arranged, polaroidImage, voiceNote } = bouquet;

  function sortedArranged(arr) {
    const order = { '_bg': 4, '_seam': 3, 'filler': 3, 'secondary': 2, 'primary': 1 };
    return [...arr].sort((a, b) => (order[a.flower.category] || 2) - (order[b.flower.category] || 2));
  }

  const skipToEnd = () => {
    setScene(5);
    setLetterLeft(false);
    setBloomedItems(arranged.map(i => i.id));
  };

  // ── SCENE 0: Intro ─────────────────────────────────────────────────────
  if (scene === 0) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0f07 0%, #3b1f0a 50%, #1a0f07 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <button onClick={skipToEnd} style={skipBtnStyle}>Skip ➔</button>
      {particles.map(p => <FloralParticle key={p.key} style={{ left: p.left, top: p.top }} />)}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, ease: 'easeOut' }}
        style={{ textAlign: 'center', zIndex: 10, padding: 40 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
          style={{ fontSize: '4rem', marginBottom: 32 }}>💐</motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, delay: 1 }}
          style={{ fontFamily: 'var(--font-script)', fontSize: '1.8rem', color: '#f2e4c0', letterSpacing: 2, lineHeight: 1.6, maxWidth: 520 }}>
          Someone special has created something for you...
        </motion.p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2, delay: 2.2 }}
          style={{ height: 1, background: 'linear-gradient(90deg,transparent,#d4b97a,transparent)', marginTop: 40 }} />
      </motion.div>
    </div>
  );

  // ── SCENE 1: Envelope ──────────────────────────────────────────────────
  if (scene === 1) return (
    <div style={{ minHeight: '100vh', background: '#fdf6e3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      <button onClick={skipToEnd} style={skipBtnStyle}>Skip ➔</button>
      <AnimatePresence>
        {!envelopeGone && (
          <motion.div
            key="envelope"
            initial={{ x: '-110vw', rotate: -8 }}
            animate={{ x: 0, rotate: [0, -4, 4, -3, 3, -1, 0] }}
            exit={{ opacity: 0, scale: 0.85, y: -30 }}
            transition={{ x: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }, rotate: { duration: 0.8, delay: 1.2, times: [0,0.2,0.4,0.6,0.8,0.9,1] } }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <motion.img src="/envelope.png" alt="Envelope" style={{ width: 320, filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.25))' }} />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
              style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem', letterSpacing: 3, color: 'var(--sepia-light)', textTransform: 'uppercase' }}>
              For {noteRecipient} ✦
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── SCENE 2: Letter with typewriter ───────────────────────────────────
  if (scene === 2) return (
    <div style={{ minHeight: '100vh', background: '#fdf6e3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <button onClick={skipToEnd} style={skipBtnStyle}>Skip ➔</button>
      <AnimatePresence>
        {!letterLeft && (
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ x: '-60vw', rotate: -6, opacity: 0.6 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ background: 'white', border: '1px solid #e0d5c1', padding: '48px 52px', maxWidth: 520, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden', maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Lined paper effect */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f0e8d8 31px, #f0e8d8 32px)', pointerEvents: 'none', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <pre style={{ fontFamily: 'var(--font-typewriter)', fontSize: '1rem', color: '#3b200a', lineHeight: 2, whiteSpace: 'pre-wrap', margin: 0, minHeight: 200 }}>
                {typedLetter}
                <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>|</motion.span>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {typingDone && !letterLeft && (
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          onClick={() => { setLetterLeft(true); setTimeout(() => setScene(3), 900); }}
          style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', ...continueBtnStyle }}>
          Continue ➔
        </motion.button>
      )}
    </div>
  );

  // ── SCENE 3: Vinyl ─────────────────────────────────────────────────────
  if (scene === 3) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1a0f07,#2e1a0a)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, position: 'relative' }}>
      <button onClick={skipToEnd} style={{ ...skipBtnStyle, color: '#d4b97a', borderColor: '#d4b97a' }}>Skip ➔</button>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ fontFamily: 'var(--font-script)', fontSize: '1.4rem', color: '#d4b97a', letterSpacing: 2 }}>
        A voice note awaits…
      </motion.p>
      <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsPlaying(p => !p)}>
        <motion.img
          src="/vinyl.png" alt="Vinyl"
          style={{ width: 260, height: 260, borderRadius: '50%', filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.6))' }}
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ rotate: { duration: 3, ease: 'linear', repeat: Infinity } }}
        />
        <motion.div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          whileHover={{ scale: 1.1 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(253,246,227,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            {isPlaying ? '⏸' : '▶'}
          </div>
        </motion.div>
      </motion.div>
      {voiceNote && (
        <audio
          src={voiceNote}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
          ref={el => {
            audioRef.current = el;
            if (el) { if (isPlaying) el.play().catch(() => {}); else el.pause(); }
          }}
        />
      )}
      {!voiceNote && (
        <p style={{ fontFamily: 'var(--font-typewriter)', color: '#a06c3e', fontSize: '0.75rem', letterSpacing: 2 }}>No voice note attached</p>
      )}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        onClick={() => { setIsPlaying(false); setScene(4); }}
        style={continueBtnStyle}>
        Reveal the Bouquet ➔
      </motion.button>
    </div>
  );

  // ── SCENE 4 + 5: Bouquet Bloom & Final ────────────────────────────────
  const sortedArr = sortedArranged(arranged);

  return (
    <div style={{ minHeight: '100vh', background: '#fdf6e3', position: 'relative', overflow: 'hidden' }}>

      {/* Skip button — only during bloom */}
      {scene === 4 && <button onClick={skipToEnd} style={skipBtnStyle}>Skip ➔</button>}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
        style={{ textAlign: 'center', paddingTop: 48, paddingBottom: 32 }}>
        <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo" style={{ height: 52, objectFit: 'contain', marginBottom: 16 }} />
        <h1 style={{ fontFamily: 'var(--font-script)', fontSize: '2.8rem', color: 'var(--ink-brown)', margin: 0 }}>A Special Correspondence</h1>
        <p style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.65rem', color: 'var(--sepia-light)', letterSpacing: 4, marginTop: 8, textTransform: 'uppercase' }}>— Sent via Floravo Atelier —</p>
      </motion.div>

      {/* Main Layout */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 48, maxWidth: 1200, margin: '0 auto', padding: '0 32px 60px' }}>

        {/* Left: Letter card */}
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
          style={{ flex: '0 0 260px', marginTop: 40 }}>
          {noteText && (
            <div style={{ background: 'white', border: '1px solid #e0d5c1', padding: '24px', transform: 'rotate(-2deg)', boxShadow: '0 12px 40px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent,transparent 23px,#f0e8d8 23px,#f0e8d8 24px)', pointerEvents: 'none', opacity: 0.4 }} />
              <div style={{ position: 'relative', fontFamily: 'var(--font-typewriter)', fontSize: '0.78rem', color: '#3b200a', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
                {`Dear ${noteRecipient},\n\n${noteText}\n\nSincerely,\n${noteSender}`}
              </div>
            </div>
          )}
          {polaroidImage && (
            <motion.div initial={{ opacity: 0, rotate: -5 }} animate={{ opacity: 1, rotate: 3 }} transition={{ delay: 0.8 }}
              style={{ marginTop: 24, background: 'white', padding: '10px 10px 36px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'inline-block' }}>
              <img src={polaroidImage} alt="Polaroid" style={{ width: 180, height: 180, objectFit: 'cover', filter: 'sepia(0.2) contrast(1.05) brightness(1.05)' }} />
            </motion.div>
          )}
          {voiceNote && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              style={{ marginTop: 20, background: 'white', border: '1px solid black', padding: '14px 16px' }}>
              <p style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--ink-brown)', marginBottom: 8, fontWeight: 'bold' }}>▶ Voice Note</p>
              <audio controls src={voiceNote} style={{ width: '100%' }} />
            </motion.div>
          )}
        </motion.div>

        {/* Center: Bouquet Canvas */}
        <div style={{ flex: '0 0 560px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
            style={{ position: 'relative', width: 560, height: 640, background: '#f9f0dc', border: '1px solid var(--parchment-deep)', boxShadow: '0 20px 80px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
            <AnimatePresence>
              {sortedArr.map((item) => {
                const isVisible = bloomedItems.includes(item.id);
                const base = item.isBg ? BG_SIZE : BASE_SIZE;
                const sz = base * item.scale;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute',
                      left: item.x - sz / 2, top: item.y - sz / 2,
                      width: sz, height: sz,
                      zIndex: item.layer,
                      transform: `rotate(${item.rotation}deg)`,
                      pointerEvents: 'none',
                    }}>
                    <img src={`/flowers/${item.flower.file}`} alt={item.flower.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Note overlay on canvas */}
            {noteText && (
              <div style={{ position: 'absolute', bottom: 30, left: 20, zIndex: 100, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))', pointerEvents: 'none' }}>
                <div style={{ background: '#fdf6e3', width: 200, padding: '12px 14px', border: '1px solid #e0d5c1', overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.72rem', color: '#5c4d3c', fontWeight: 'bold', marginBottom: 4 }}>Dear {noteRecipient},</div>
                  <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.68rem', color: '#5c4d3c', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{noteText.slice(0, 80)}{noteText.length > 80 ? '…' : ''}</div>
                  <div style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.68rem', color: '#5c4d3c', fontWeight: 'bold', textAlign: 'right', marginTop: 4 }}>Sincerely, {noteSender}</div>
                </div>
              </div>
            )}
            {polaroidImage && (
              <div style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 101, transform: 'rotate(8deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.25))', pointerEvents: 'none' }}>
                <div style={{ background: 'white', width: 140, padding: '8px 8px 32px' }}>
                  <img src={polaroidImage} alt="Polaroid" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                </div>
              </div>
            )}
          </motion.div>

          {/* Action buttons */}
          {scene === 5 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => {
                const link = window.location.href;
                navigator.clipboard.writeText(link).then(() => alert('Link copied!')).catch(() => {});
              }} style={{ padding: '12px 28px', border: '1px solid black', background: 'white', fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem', letterSpacing: 2, cursor: 'pointer' }}>
                🔗 Share This Bouquet
              </button>
              <a href="/" style={{ padding: '12px 28px', background: 'black', color: 'white', textDecoration: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem', letterSpacing: 2, display: 'inline-block' }}>
                Create Your Own
              </a>
            </motion.div>
          )}
        </div>

        {/* Right: decorative */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.6 }}
          style={{ flex: '0 0 160px', marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20 }}>
          <img src="/flowers/sunflower.png" style={{ height: 200, objectFit: 'contain', opacity: 0.9 }} alt="Decoration" />
          <img src="/flowers/lilly.png" style={{ height: 180, objectFit: 'contain', opacity: 0.8, transform: 'rotate(10deg)' }} alt="Decoration" />
        </motion.div>
      </div>
    </div>
  );
}

const skipBtnStyle = {
  position: 'fixed', top: 24, right: 24, zIndex: 1000,
  padding: '10px 22px', border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
  color: 'white', fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem',
  letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase',
  transition: 'all 0.2s',
};

const continueBtnStyle = {
  padding: '14px 36px', border: '1px solid black', background: 'black',
  color: 'white', fontFamily: 'var(--font-typewriter)', fontSize: '0.8rem',
  letterSpacing: 3, cursor: 'pointer', textTransform: 'uppercase',
};
