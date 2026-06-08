'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useAnimationFrame } from 'framer-motion';

const BASE_SIZE = 200;
const BG_SIZE = 320;

// ── Floral particle for scene 1
const PETAL_FILES = ['pink_tulip.png','tulip_white.png','yellow_tulip.png','carnation_pink.png','carnation_red.png','gergebra_pink.png','gergebra_orange.png'];
function FloralParticle({ file, left, top, size, delay, duration }) {
  return (
    <motion.div
      style={{ position: 'absolute', left, top, width: size, height: size, filter: 'blur(2.5px)', opacity: 0, pointerEvents: 'none' }}
      animate={{ opacity: [0, 0.55, 0], y: [0, -120], rotate: [0, 40], scale: [1, 1.1, 0.9] }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <img src={`/flowers/${file}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
  const vinylAudioRef = useRef(null);
  const [finalVinylPlaying, setFinalVinylPlaying] = useState(false);
  const finalVinylRot = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (finalVinylPlaying) finalVinylRot.set(finalVinylRot.get() + delta * 0.06);
  });
  // Vinyl rotation for scene 3 — frame-driven, no seam, true pause
  const vinylRot = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (isPlaying) vinylRot.set(vinylRot.get() + delta * 0.06);
  });
  const particles = useRef(Array.from({ length: 22 }, (_, i) => ({
    file: PETAL_FILES[i % PETAL_FILES.length],
    left: `${(i * 4.5 + Math.random() * 5) % 100}%`,
    top: `${Math.random() * 90}%`,
    size: Math.floor(Math.random() * 40 + 28),
    delay: Math.random() * 5,
    duration: Math.random() * 5 + 5,
    key: i,
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
    const t = setTimeout(() => setScene(1), 5500);
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
      {particles.map(p => <FloralParticle key={p.key} file={p.file} left={p.left} top={p.top} size={p.size} delay={p.delay} duration={p.duration} />)}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.5, ease: 'easeOut' }}
        style={{ textAlign: 'center', zIndex: 10, padding: 40 }}>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 2, delay: 0.5, ease: [0.22,1,0.36,1] }}
          style={{ width: 140, height: 140, margin: '0 auto 32px', filter: 'drop-shadow(0 12px 40px rgba(212,185,122,0.4))' }}>
          <img src="/flowers/penoy.png" alt="Peony" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 2, delay: 1.2 }}
          style={{ fontFamily: 'var(--font-script)', fontSize: '2rem', color: '#f2e4c0', letterSpacing: 2, lineHeight: 1.7, maxWidth: 540 }}>
          Someone special has created something for you...
        </motion.p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, delay: 3 }}
          style={{ height: 1, background: 'linear-gradient(90deg,transparent,#d4b97a,transparent)', marginTop: 48 }} />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6, duration: 1 }}
          style={{ fontFamily: 'var(--font-typewriter)', fontSize: '0.65rem', color: '#a06c3e', letterSpacing: 4, marginTop: 20, textTransform: 'uppercase' }}>
          — via Floravo Atelier —
        </motion.p>
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
      <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        {/* Vinyl disc — rotation driven by useAnimationFrame, no seam */}
        <motion.img
          src="/vinyl.png" alt="Vinyl"
          style={{ width: 260, height: 260, borderRadius: '50%', filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.7))', rotate: vinylRot }}
        />
        {/* Play/Pause button BELOW the vinyl */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
          onClick={() => {
            const next = !isPlaying;
            setIsPlaying(next);
            if (audioRef.current) { next ? audioRef.current.play().catch(()=>{}) : audioRef.current.pause(); }
          }}
          style={{ marginTop: 28, width: 64, height: 64, borderRadius: '50%', background: 'rgba(253,246,227,0.95)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', cursor: 'pointer' }}>
          {isPlaying ? '⏸' : '▶'}
        </motion.button>
        {!voiceNote && (
          <p style={{ fontFamily: 'var(--font-typewriter)', color: '#a06c3e', fontSize: '0.75rem', letterSpacing: 2, marginTop: 16 }}>No voice note attached</p>
        )}
      </motion.div>
      {voiceNote && (
        <audio src={voiceNote} onEnded={() => setIsPlaying(false)} style={{ display: 'none' }}
          ref={el => { audioRef.current = el; }} />
      )}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        onClick={() => { setIsPlaying(false); if(audioRef.current) audioRef.current.pause(); setScene(4); }}
        style={continueBtnStyle}>
        Reveal the Bouquet ➔
      </motion.button>
    </div>
  );

  // ── Flower meanings ──────────────────────────────────────────────────
  const MEANINGS = {
    rose:'Love, passion and deep affection.',sunflower:'Adoration, loyalty and lasting happiness.',
    penoy:'Romance, prosperity and good fortune.',lilly:'Devotion, admiration and gentle love.',
    pink_tulip:'Perfect love and happiness.',tulip_white:'Purity, forgiveness and new beginnings.',
    yellow_tulip:'Cheerful thoughts and sunshine.',carnation_red:'Deep love and admiration.',
    carnation_pink:'Gratitude and admiration.',carnation_yellow:'Joy and cheerfulness.',
    gergebra_orange:'Warmth, enthusiasm and joy.',gergebra_pink:'Admiration and grace.',
    gergebra_white:'Innocence and purity.',gergebra_yellow:'Happiness and friendship.',
    hydrarenga:'Heartfelt emotions and gratitude.',white:'Purity and new beginnings.',
    babys_breath:'Everlasting love and innocence.',eucaluptus:'Protection and abundance.',
  };

  // Unique primary/secondary flowers for right panel
  const featuredFlowers = (() => {
    const seen = new Set();
    const out = [];
    for (const item of arranged) {
      const c = item.flower.category;
      if ((c === 'primary' || c === 'secondary') && !seen.has(item.flower.id)) {
        seen.add(item.flower.id);
        out.push(item.flower);
        if (out.length >= 4) break;
      }
    }
    return out;
  })();

  // ── SCENE 4 + 5: Bouquet Bloom & Final ────────────────────────────────
  const sortedArr = sortedArranged(arranged);

  return (
    <div style={{ minHeight:'100vh', background:'#f5ede0', fontFamily:'var(--font-body)' }}>

      {/* ── TOP BAR ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 40px', borderBottom:'1px solid #e8d9c8', background:'#f5ede0' }}>
        <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo" style={{ height:44, objectFit:'contain' }} />
        <div style={{ textAlign:'center' }}>
          <h1 style={{ fontFamily:'var(--font-script)', fontSize:'2.4rem', color:'#3b200a', margin:0, lineHeight:1 }}>A Special Correspondence</h1>
          <p style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.6rem', color:'#a06c3e', letterSpacing:4, margin:'6px 0 0', textTransform:'uppercase' }}>— Sent via Floravo Atelier —</p>
        </div>
        {scene===4
          ? <button onClick={skipToEnd} style={{ padding:'10px 22px', border:'1px solid #3b200a', background:'transparent', fontFamily:'var(--font-typewriter)', fontSize:'0.7rem', letterSpacing:2, cursor:'pointer', textTransform:'uppercase' }}>Skip ➔</button>
          : <div style={{ width:100 }} />}
      </div>

      {/* ── THREE COLUMNS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr 280px', gap:24, maxWidth:1280, margin:'0 auto', padding:'28px 32px 60px', alignItems:'start' }}>

        {/* ── LEFT PANEL ── */}
        <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.2}}
          style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Note card */}
          {noteText && (
            <div style={{ background:'white', borderRadius:12, padding:'20px 22px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #ede0cc' }}>
              <p style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.58rem', letterSpacing:3, textTransform:'uppercase', color:'#a06c3e', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>🌿 Your Note</p>
              <div style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.8rem', color:'#3b200a', lineHeight:2, whiteSpace:'pre-wrap' }}>
                {`Dear ${noteRecipient},\n\n${noteText}\n\nSincerely,\n${noteSender}`}
              </div>
            </div>
          )}

          {/* Polaroid */}
          {polaroidImage && (
            <div style={{ background:'white', borderRadius:12, padding:'16px 18px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #ede0cc' }}>
              <p style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.58rem', letterSpacing:3, textTransform:'uppercase', color:'#a06c3e', marginBottom:12 }}>👤 From You</p>
              <img src={polaroidImage} alt="Polaroid" style={{ width:'100%', borderRadius:6, objectFit:'cover', display:'block', filter:'sepia(0.15) contrast(1.05) brightness(1.04)' }} />
            </div>
          )}

          {/* Vinyl voice note */}
          {voiceNote && (
            <div style={{ background:'white', borderRadius:12, padding:'18px 20px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #ede0cc', display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
              <p style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.58rem', letterSpacing:3, textTransform:'uppercase', color:'#a06c3e', marginBottom:14, alignSelf:'flex-start', display:'flex', alignItems:'center', gap:6 }}>🎵 Voice Note</p>
              <motion.img src="/vinyl.png" alt="Vinyl"
                style={{ width:110, height:110, borderRadius:'50%', filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.3))', rotate:finalVinylRot }} />
              <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.93}}
                onClick={() => {
                  const next = !finalVinylPlaying;
                  setFinalVinylPlaying(next);
                  if (vinylAudioRef.current) { next ? vinylAudioRef.current.play().catch(()=>{}) : vinylAudioRef.current.pause(); }
                }}
                style={{ marginTop:16, width:48, height:48, borderRadius:'50%', background:'#3b200a', border:'none', color:'white', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
                {finalVinylPlaying ? '⏸' : '▶'}
              </motion.button>
              <audio src={voiceNote} onEnded={()=>setFinalVinylPlaying(false)} style={{display:'none'}} ref={el=>{vinylAudioRef.current=el;}} />
            </div>
          )}
        </motion.div>

        {/* ── CENTER: BOUQUET CANVAS ── */}
        <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} transition={{duration:0.9}}
          style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ position:'relative', width:560, height:640, background:'#fdf6e3', borderRadius:16, boxShadow:'0 8px 48px rgba(0,0,0,0.1)', overflow:'hidden', border:'1px solid #e8d9c8' }}>
            {sortedArr.map(item => {
              const isVisible = bloomedItems.includes(item.id);
              const base = item.isBg ? BG_SIZE : BASE_SIZE;
              const sz = base * item.scale;
              return (
                <motion.div key={item.id}
                  initial={{opacity:0,scale:0.3}} animate={isVisible?{opacity:1,scale:1}:{opacity:0,scale:0.3}}
                  transition={{duration:0.7,ease:[0.22,1,0.36,1]}}
                  style={{ position:'absolute', left:item.x-sz/2, top:item.y-sz/2, width:sz, height:sz, zIndex:item.layer, transform:`rotate(${item.rotation}deg)`, pointerEvents:'none' }}>
                  <img src={`/flowers/${item.flower.file}`} alt={item.flower.name} style={{width:'100%',height:'100%',objectFit:'contain'}} />
                </motion.div>
              );
            })}
            {polaroidImage && (
              <div style={{position:'absolute',bottom:24,right:16,zIndex:101,transform:'rotate(7deg)',filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',pointerEvents:'none'}}>
                <div style={{background:'white',padding:'8px 8px 28px',width:130}}>
                  <img src={polaroidImage} alt="Polaroid" style={{width:'100%',height:110,objectFit:'cover',display:'block'}} />
                </div>
              </div>
            )}
          </div>
          {scene===5 && (
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
              style={{display:'flex',gap:12,marginTop:22,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>navigator.clipboard.writeText(window.location.href).then(()=>alert('Link copied!'))}
                style={{padding:'12px 26px',border:'1px solid #3b200a',background:'white',fontFamily:'var(--font-typewriter)',fontSize:'0.72rem',letterSpacing:2,cursor:'pointer',borderRadius:4}}>
                🔗 Share
              </button>
              <a href="/" style={{padding:'12px 26px',background:'#3b200a',color:'white',textDecoration:'none',fontFamily:'var(--font-typewriter)',fontSize:'0.72rem',letterSpacing:2,borderRadius:4,display:'inline-block'}}>
                Create Your Own
              </a>
            </motion.div>
          )}
        </motion.div>

        {/* ── RIGHT PANEL ── */}
        <motion.div initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.3}}
          style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Flowers in this bouquet */}
          {featuredFlowers.length > 0 && (
            <div style={{ background:'white', borderRadius:12, padding:'20px 22px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #ede0cc' }}>
              <p style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.58rem', letterSpacing:3, textTransform:'uppercase', color:'#a06c3e', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>🌿 Flowers in this Letter</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {featuredFlowers.map(f => (
                  <div key={f.id} style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <img src={`/flowers/${f.file}`} alt={f.name} style={{ width:52, height:52, objectFit:'contain', flexShrink:0, filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                    <div>
                      <p style={{ fontFamily:'var(--font-typewriter)', fontSize:'0.68rem', fontWeight:'bold', textTransform:'uppercase', letterSpacing:1, color:'#3b200a', margin:0 }}>{f.name}</p>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'#a06c3e', margin:'3px 0 0', lineHeight:1.4 }}>{MEANINGS[f.id] || 'A beautiful sentiment.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quote card */}
          <div style={{ background:'white', borderRadius:12, padding:'24px 22px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid #ede0cc', textAlign:'center' }}>
            <div style={{ fontSize:'1.6rem', color:'#c9a96e', marginBottom:12 }}>"</div>
            <p style={{ fontFamily:'var(--font-script)', fontSize:'1.15rem', color:'#3b200a', lineHeight:1.7, margin:0 }}>
              Some feelings bloom in silence and speak through flowers.
            </p>
            <img src="/flowers/lilly.png" alt="" style={{ height:60, objectFit:'contain', opacity:0.35, marginTop:16 }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const skipBtnStyle = {
  position:'fixed', top:24, right:24, zIndex:1000,
  padding:'10px 22px', border:'1px solid rgba(255,255,255,0.3)',
  background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)',
  color:'white', fontFamily:'var(--font-typewriter)', fontSize:'0.75rem',
  letterSpacing:2, cursor:'pointer', textTransform:'uppercase', transition:'all 0.2s',
};

const continueBtnStyle = {
  padding:'14px 36px', border:'1px solid black', background:'black',
  color:'white', fontFamily:'var(--font-typewriter)', fontSize:'0.8rem',
  letterSpacing:3, cursor:'pointer', textTransform:'uppercase',
};

