'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { logOut } from '../../lib/auth';

function LeafSprig({ style }) {
  return (
    <div style={{ width: 44, height: 44, opacity: 0.45, ...style }}>
      <svg width="100%" height="100%" viewBox="0 0 44 44" fill="none" stroke="#b08a5e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 38 C 12 34, 26 24, 38 6" />
        <path d="M38 6 C 36 10, 31 11, 29 9 C 27 7, 28 2, 38 6 Z" />
        <path d="M28 14 C 28 18, 23 18, 21 16 C 19 14, 21 10, 28 14 Z" />
        <path d="M22 20 C 18 20, 16 23, 17 25 C 19 27, 21 24, 22 20 Z" />
        <path d="M18 26 C 18 30, 13 30, 11 28 C 9 26, 11 22, 18 26 Z" />
        <path d="M12 32 C 8 32, 6 35, 7 37 C 9 39, 11 36, 12 32 Z" />
      </svg>
    </div>
  );
}

const FLOWERS = [
  { id: 'rose',           name: 'Rose',           file: 'rose.png',           category: 'primary' },
  { id: 'sunflower',      name: 'Sunflower',       file: 'sunflower.png',      category: 'primary' },
  { id: 'penoy',          name: 'Peony',           file: 'penoy.png',          category: 'primary' },
  { id: 'lilly',          name: 'Lily',            file: 'lilly.png',          category: 'primary' },
  { id: 'pink_tulip',     name: 'Tulip (Pink)',    file: 'pink_tulip.png',     category: 'secondary' },
  { id: 'tulip_white',    name: 'Tulip (White)',   file: 'tulip_white.png',    category: 'secondary' },
  { id: 'yellow_tulip',   name: 'Tulip (Yellow)',  file: 'yellow_tulip.png',   category: 'secondary' },
  { id: 'carnation_red',  name: 'Carnation (Red)', file: 'carnation_red.png',  category: 'secondary' },
  { id: 'carnation_pink', name: 'Carnation (Pink)',file: 'carnation_pink.png', category: 'secondary' },
  { id: 'carnation_yellow',name:'Carnation (Ylw)', file: 'carnation_yellow.png',category:'secondary'},
  { id: 'gergebra_orange',name: 'Gerbera (Org)',  file: 'gergebra_orange.png', category: 'secondary' },
  { id: 'gergebra_pink',  name: 'Gerbera (Pink)', file: 'gergebra_pink.png',   category: 'secondary' },
  { id: 'gergebra_white', name: 'Gerbera (Wht)',  file: 'gergebra_white.png',  category: 'secondary' },
  { id: 'gergebra_yellow',name: 'Gerbera (Ylw)',  file: 'gergebra_yellow.png', category: 'secondary' },
  { id: 'hydrarenga',     name: 'Hydrangea',       file: 'hydrarenga.png',     category: 'secondary' },
  { id: 'white',          name: 'White Flower',    file: 'white.png',          category: 'secondary' },
  { id: 'babys_breath',   name: "Baby's Breath",   file: 'babys_breath.png',   category: 'filler' },
  { id: 'eucaluptus',     name: 'Eucalyptus',      file: 'eucaluptus.png',     category: 'filler' },
];

// ─────────────────────────────────────────────
// LAYER SYSTEM (back → front)
//  0  : greenery1-5  — large BG foliage, always auto-placed
//  1  : fern/eucalyptus/ruscus/babys_breath — seam fillers, always auto-placed
//  2-3: secondary flowers — mid-cluster dome
//  4-5: primary flowers  — focal points only
// ─────────────────────────────────────────────

const BASE_SIZE = 200; // base px for flowers
const BG_SIZE   = 320; // base px for greenery background images

// ── The 5 large greenery bg images (always auto-injected)
const BG_GREENERY = [
  { id: 'bg1', name: 'Greenery', file: 'greenery1.png', category: '_bg' },
  { id: 'bg2', name: 'Greenery', file: 'greenery2.png', category: '_bg' },
  { id: 'bg3', name: 'Greenery', file: 'greenery3.png', category: '_bg' },
  { id: 'bg4', name: 'Greenery', file: 'greenery4.png', category: '_bg' },
  { id: 'bg5', name: 'Greenery', file: 'greenery5.png', category: '_bg' },
];

// ── The 2 seam-filler plants (auto-injected based on flower type)
const SEAM_FILLERS = [
  { id: 'eucaluptus', name: 'Eucalyptus',     file: 'eucaluptus.png',  category: '_seam' },
  { id: 'babys_breath',name:"Baby's Breath",  file: 'babys_breath.png',category: '_seam' },
];

// Canvas: 560w × 640h
// Layer 0 – single BG greenery image, centred and filling the canvas
const BG_ANCHOR = { x: 280, y: 360, scale: 1.55, rotation: 0, layer: 0 };

// Layer 1 – seam fillers: bridge between large greenery and flowers
const SEAM_ANCHORS = [
  { x: 280, y: 290, scale: 1.05, rotation:   2, layer: 1 }, // center
  { x: 180, y: 300, scale: 0.95, rotation: -22, layer: 1 }, // left
  { x: 380, y: 300, scale: 0.95, rotation:  22, layer: 1 }, // right
  { x: 120, y: 270, scale: 0.88, rotation: -42, layer: 1 }, // outer left
  { x: 440, y: 270, scale: 0.88, rotation:  42, layer: 1 }, // outer right
  { x: 230, y: 230, scale: 0.82, rotation: -15, layer: 1 }, // upper left
  { x: 330, y: 230, scale: 0.82, rotation:  15, layer: 1 }, // upper right
  { x: 280, y: 210, scale: 0.78, rotation:   5, layer: 1 }, // top center
];

// Layer 2-3 – secondary flowers: tight dome
const SECONDARY_ANCHORS = [
  { x: 280, y: 240, scale: 0.98, rotation:   0, layer: 3 },
  { x: 200, y: 265, scale: 0.92, rotation: -16, layer: 2 },
  { x: 360, y: 265, scale: 0.92, rotation:  16, layer: 2 },
  { x: 235, y: 205, scale: 0.88, rotation: -10, layer: 3 },
  { x: 325, y: 205, scale: 0.88, rotation:  10, layer: 3 },
  { x: 155, y: 300, scale: 0.84, rotation: -26, layer: 2 },
  { x: 405, y: 300, scale: 0.84, rotation:  26, layer: 2 },
  { x: 280, y: 310, scale: 0.90, rotation:   4, layer: 3 },
  { x: 210, y: 165, scale: 0.80, rotation: -18, layer: 2 },
  { x: 350, y: 165, scale: 0.80, rotation:  18, layer: 2 },
];

// Layer 4-5 – primary flowers: only key focal positions
const PRIMARY_ANCHORS = [
  { x: 280, y: 218, scale: 1.10, rotation:   0, layer: 5 }, // center hero
  { x: 195, y: 252, scale: 1.00, rotation: -12, layer: 4 }, // left focal
  { x: 365, y: 252, scale: 1.00, rotation:  12, layer: 4 }, // right focal
  { x: 280, y: 305, scale: 0.95, rotation:   3, layer: 4 }, // lower center
  { x: 225, y: 172, scale: 0.90, rotation: -20, layer: 4 }, // upper left
  { x: 335, y: 172, scale: 0.90, rotation:  20, layer: 4 }, // upper right
];

function jitter(anchor, jx = 18, jy = 14, jr = 10, js = 0.06) {
  return {
    x: anchor.x + (Math.random() - 0.5) * jx,
    y: anchor.y + (Math.random() - 0.5) * jy,
    rotation: anchor.rotation + (Math.random() - 0.5) * jr,
    scale: Math.max(0.7, anchor.scale + (Math.random() - 0.5) * js),
    layer: anchor.layer,
  };
}

// bgFile: filename like 'greenery1.png' — which single bg image to use
function generateArrangement(selectedFlowers, bgFile = 'greenery1.png') {
  const result = [];
  const ts = Date.now();

  // ── LAYER 0: single large background greenery image
  const bgJitter = jitter(BG_ANCHOR, 10, 8, 4, 0.05);
  result.push({
    id: `bg-0-${ts}`,
    flower: { id: 'bg', name: 'Greenery', file: bgFile, category: '_bg' },
    ...bgJitter,
    isBg: true,
  });

  // ── LAYER 1: always place seam fillers (choose based on primary flowers)
  let usesRomanticFiller = selectedFlowers.some(f => ['rose', 'penoy', 'carnation_red', 'carnation_pink', 'pink_tulip'].includes(f.flower.id));
  let chosenFiller = usesRomanticFiller ? SEAM_FILLERS.find(f => f.id === 'babys_breath') : SEAM_FILLERS.find(f => f.id === 'eucaluptus');

  const seamAnchors = [...SEAM_ANCHORS].sort(() => Math.random() - 0.5);
  seamAnchors.forEach((a, i) => {
    const j = jitter(a, 16, 12, 12, 0.07);
    result.push({ id: `seam-${i}-${ts}`, flower: chosenFiller, ...j, isSeam: true });
  });

  // ── LAYERS 2-5: user-selected flowers sorted by category
  const primaries   = [];
  const secondaries = [];
  selectedFlowers.forEach(({ flower, count }) => {
    if (flower.category === 'filler') return; // auto-handled by seam layer
    for (let i = 0; i < count; i++) {
      if (flower.category === 'primary') primaries.push(flower);
      else secondaries.push(flower);
    }
  });

  const secAnchors = [...SECONDARY_ANCHORS].sort(() => Math.random() - 0.5);
  secondaries.forEach((flower, i) => {
    const a = secAnchors[i % secAnchors.length];
    result.push({ id: `sec-${flower.id}-${i}-${ts}`, flower, ...jitter(a, 20, 16, 12, 0.07) });
  });

  const priAnchors = [...PRIMARY_ANCHORS].sort(() => Math.random() - 0.5);
  primaries.slice(0, PRIMARY_ANCHORS.length).forEach((flower, i) => {
    result.push({ id: `pri-${flower.id}-${i}-${ts}`, flower, ...jitter(priAnchors[i], 14, 10, 8, 0.05) });
  });

  return result;
}

const BASE_FLOWER_SIZE = BASE_SIZE;

export default function BuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedFlowers, setSelectedFlowers] = useState([]);
  const [arranged, setArranged] = useState([]);
  const [activeFlower, setActiveFlower] = useState(null);
  const [filterCat, setFilterCat] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedGreenery, setSelectedGreenery] = useState('greenery1.png');
  const [noteText, setNoteText] = useState('');
  const [noteRecipient, setNoteRecipient] = useState('Beloved');
  const [noteSender, setNoteSender] = useState('Secret Admirer');
  const [polaroidImage, setPolaroidImage] = useState(null);
  const [voiceClip, setVoiceClip] = useState(null);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState('');
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [currentStep, setCurrentStep] = useState('arrange');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPolaroidImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    };
  }, [voicePreviewUrl]);

  const clearVoiceNote = () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    setVoiceClip(null);
    setVoicePreviewUrl('');
    setVoiceError('');
    setRecordingVoice(false);
    voiceChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

  const startVoiceRecording = async () => {
    setVoiceError('');

    if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice notes are not supported in this browser.');
      return;
    }

    try {
      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
        setVoicePreviewUrl('');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setVoiceClip(blob);
        setVoicePreviewUrl(url);
        setRecordingVoice(false);
        voiceChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      setRecordingVoice(true);
      recorder.start();
    } catch (error) {
      setVoiceError(error?.name === 'NotAllowedError'
        ? 'Microphone permission was denied.'
        : 'Could not start voice recording.');
      setRecordingVoice(false);
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const toggleVoiceRecording = () => {
    if (recordingVoice) stopVoiceRecording();
    else startVoiceRecording();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/');
      else { setUser(u); setCheckingAuth(false); }
    });
    return () => unsub();
  }, [router]);

  const addFlower = (flower) => {
    setSelectedFlowers((prev) => {
      const totalCount = prev.reduce((acc, curr) => acc + curr.count, 0);
      if (totalCount >= 15) {
        alert("Maximum of 15 flowers reached for the sweet spot!");
        return prev;
      }
      const existing = prev.find((f) => f.flower.id === flower.id);
      if (existing) return prev.map((f) => f.flower.id === flower.id ? { ...f, count: f.count + 1 } : f);
      return [...prev, { flower, count: 1 }];
    });
  };

  const removeFlowerFromSelection = (flowerId) => {
    setSelectedFlowers((prev) => {
      const existing = prev.find((f) => f.flower.id === flowerId);
      if (!existing) return prev;
      if (existing.count <= 1) return prev.filter((f) => f.flower.id !== flowerId);
      return prev.map((f) => f.flower.id === flowerId ? { ...f, count: f.count - 1 } : f);
    });
  };

  const autoArrange = useCallback(() => {
    const totalCount = selectedFlowers.reduce((acc, curr) => acc + curr.count, 0);
    if (totalCount < 5) {
      alert("Please select at least 5 flowers for a beautiful arrangement.");
      return;
    }
    setArranged(generateArrangement(selectedFlowers, selectedGreenery));
    setActiveFlower(null);
  }, [selectedFlowers, selectedGreenery]);

  const shuffleArrangement = () => {
    if (arranged.length === 0) return;
    // Re-run arrangement with same greenery but fresh random jitter on flower positions
    setArranged(generateArrangement(selectedFlowers, selectedGreenery));
    setActiveFlower(null);
  };

  // When user picks a different greenery, swap only the bg item in-place
  const changeGreenery = (file) => {
    setSelectedGreenery(file);
    setArranged((prev) =>
      prev.map((item) =>
        item.isBg
          ? { ...item, flower: { id: 'bg', name: 'Greenery', file, category: '_bg' } }
          : item
      )
    );
  };

  const deleteActive = () => {
    if (!activeFlower) return;
    setArranged((prev) => prev.filter((f) => f.id !== activeFlower));
    setActiveFlower(null);
  };

  const rotateActive = (deg) => {
    if (!activeFlower) return;
    setArranged((prev) => prev.map((f) => f.id === activeFlower ? { ...f, rotation: f.rotation + deg } : f));
  };

  const resizeActive = (delta) => {
    if (!activeFlower) return;
    setArranged((prev) => prev.map((f) =>
      f.id === activeFlower ? { ...f, scale: Math.max(0.2, Math.min(1.4, f.scale + delta)) } : f
    ));
  };

  const moveLayer = (direction) => {
    if (!activeFlower) return;
    setArranged((prev) => prev.map((f) =>
      f.id === activeFlower ? { ...f, layer: f.layer + direction } : f
    ));
  };

  const clearAll = () => { setArranged([]); setSelectedFlowers([]); setActiveFlower(null); clearVoiceNote(); };

  const exportPNG = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 560; canvas.height = 640;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f9f0dc';
    ctx.fillRect(0, 0, 560, 640);

    const sorted = [...arranged].sort((a, b) => a.layer - b.layer);

    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {


      const flowerImages = await Promise.all(
        sorted.map(item => loadImage(`/flowers/${item.flower.file}`))
      );

      sorted.forEach((item, index) => {
        const img = flowerImages[index];
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate((item.rotation * Math.PI) / 180);
        
        const base = item.isBg ? BG_SIZE : BASE_SIZE;
        const sz = base * item.scale;
        
        // Emulate CSS object-fit: contain for canvas
        let dw = sz;
        let dh = sz;
        const imgRatio = img.width / img.height;
        if (imgRatio > 1) {
          dh = sz / imgRatio;
        } else if (imgRatio < 1) {
          dw = sz * imgRatio;
        }
        
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      });

      if (noteText) {
        ctx.save();
        ctx.translate(20, 480);
        ctx.rotate((-4 * Math.PI) / 180);
        
        ctx.fillStyle = '#fdf6e3';
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
        ctx.fillRect(0, 0, 220, 130);
        
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#e0d5c1'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, 220, 130);
        
        ctx.fillStyle = '#5c4d3c';
        ctx.font = 'bold 13px Courier New';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Dear ${noteRecipient},`, 16, 16);
        
        ctx.font = '12px Courier New';
        const lines = noteText.split('\n');
        lines.slice(0, 4).forEach((line, i) => {
          ctx.fillText(line, 16, 40 + (i * 16));
        });

        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`Sincerely, ${noteSender}`, 204, 104);
        ctx.restore();
      }

      if (polaroidImage) {
        const pImg = await loadImage(polaroidImage);
        ctx.save();
        ctx.translate(380, 460);
        ctx.rotate((8 * Math.PI) / 180);
        
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
        ctx.fillRect(0, 0, 160, 190);
        
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(12, 12, 136, 136);
        ctx.filter = 'sepia(20%) contrast(105%) brightness(105%) saturate(90%) hue-rotate(-5deg)';
        
        // Emulate CSS object-fit: cover for canvas
        const imgRatio = pImg.width / pImg.height;
        let sx = 0, sy = 0, sw = pImg.width, sh = pImg.height;
        if (imgRatio > 1) { // 1 is containerRatio (136/136)
          sw = pImg.height;
          sx = (pImg.width - sw) / 2;
        } else {
          sh = pImg.width;
          sy = (pImg.height - sh) / 2;
        }
        
        ctx.drawImage(pImg, sx, sy, sw, sh, 12, 12, 136, 136);
        ctx.filter = 'none';
        
        ctx.restore();
      }

      if (voicePreviewUrl) {
        ctx.save();
        ctx.translate(430, 230);
        ctx.rotate((6 * Math.PI) / 180);
        ctx.fillStyle = '#fff7e8';
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        ctx.fillRect(0, 0, 112, 34);
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#d5c29f';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 112, 34);
        ctx.fillStyle = '#5c4d3c';
        ctx.font = 'bold 10px Courier New';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('VOICE NOTE', 12, 14);
        ctx.fillText('ATTACHED', 12, 24);
        ctx.restore();
      }

      download(canvas);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const download = (canvas) => {
    const a = document.createElement('a');
    a.download = 'my-bouquet.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const saveAndShareBouquet = async () => {
    setSaving(true);
    setShareUrl('');
    try {
      let voiceNoteBase64 = null;
      if (voiceClip) {
        voiceNoteBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(voiceClip);
        });
      }

      const payload = {
        noteRecipient,
        noteSender,
        noteText,
        arranged: arranged.map(item => ({
          id: item.id,
          flower: {
            id: item.flower.id,
            name: item.flower.name,
            file: item.flower.file,
            category: item.flower.category,
          },
          x: item.x,
          y: item.y,
          scale: item.scale,
          rotation: item.rotation,
          layer: item.layer,
          isBg: !!item.isBg,
          isSeam: !!item.isSeam,
        })),
        polaroidImage,
        voiceNote: voiceNoteBase64,
      };

      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/bouquets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        setShareUrl(`${origin}/view/${data.id}`);
      } else {
        alert('Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error connecting to the backend server. Make sure the backend server is running on port 5000.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => { await logOut(); router.replace('/'); };

  const filteredFlowers = filterCat === 'all' ? FLOWERS : FLOWERS.filter((f) => f.category === filterCat);

  if (checkingAuth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="font-typewriter text-sepia" style={{ fontSize: '0.8rem', letterSpacing: '3px' }}>Opening the Atelier…</span>
    </div>
  );

  if (currentStep === 'personalize') {
    return (
      <div style={{ minHeight: '100vh', background: '#fdf6e3', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Ornaments */}
        <img src="/flowers/lineart%20left.png" alt="" style={{ position: 'absolute', left: 0, bottom: 0, height: '420px', width: 'auto', objectFit: 'contain', pointerEvents: 'none', zIndex: 0, opacity: 0.9 }} />
        <img src="/flowers/lineart%20right.png" alt="" style={{ position: 'absolute', right: 0, bottom: 0, height: '420px', width: 'auto', objectFit: 'contain', pointerEvents: 'none', zIndex: 0, opacity: 0.9 }} />

        <div style={{ padding: '40px 0 20px', position: 'relative', zIndex: 10 }}>
          <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 60, objectFit: 'contain' }} />
        </div>
        
        <div className="font-typewriter" style={{ fontSize: '1rem', letterSpacing: '4px', margin: '0 0 40px 0', color: 'var(--ink-brown)', fontWeight: 'bold' }}>
          WRITE THE CARD
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 60, flex: 1, width: '100%', maxWidth: 1100 }}>
          <div style={{ flex: 0.7, display: 'flex', justifyContent: 'flex-end', opacity: 0.9 }}>
             <img src="/flowers/lilly.png" style={{ height: 300, objectFit: 'contain' }} alt="Decoration" />
          </div>
          
          <div style={{ background: '#fdfbf7', border: '1px solid #ede0cc', borderRadius: 24, padding: '40px 48px', width: 420, minHeight: 400, display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(59,32,10,0.06)', position: 'relative', overflow: 'hidden' }}>
             
             {/* Corner Leaf Sprigs */}
             <LeafSprig style={{ position: 'absolute', top: 18, left: 18, transform: 'rotate(0deg)' }} />
             <LeafSprig style={{ position: 'absolute', bottom: 18, right: 18, transform: 'scale(-1)' }} />

             {/* Lined paper effect */}
             <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #ede0cc 31px, #ede0cc 32px)', pointerEvents: 'none', opacity: 0.6 }} />

             <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', flex: 1, paddingTop: 8 }}>
               <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                 <div className="font-typewriter" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b200a' }}>Dear </div>
                 <input 
                   value={noteRecipient} 
                   onChange={e => setNoteRecipient(e.target.value)} 
                   style={{ border: 'none', borderBottom: '1px dashed #ede0cc', outline: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '1.2rem', color: '#3b200a', marginLeft: 8, flex: 1, background: 'transparent' }}
                 />
                 <span className="font-typewriter" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b200a' }}>,</span>
               </div>
               <textarea 
                 value={noteText} onChange={e => setNoteText(e.target.value)}
                 maxLength={120}
                 style={{ flex: 1, border: 'none', resize: 'none', outline: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '1.05rem', color: '#3b200a', lineHeight: '32px', background: 'transparent' }}
                 placeholder="I have so much to tell you, but only this much space on this card! Still, you must know..."
               />
               <div className="font-typewriter" style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right', marginTop: 20, color: '#3b200a' }}>Sincerely,</div>
               <input 
                 value={noteSender} 
                 onChange={e => setNoteSender(e.target.value)}
                 style={{ border: 'none', borderBottom: '1px dashed #ede0cc', outline: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '1.2rem', color: '#3b200a', textAlign: 'right', background: 'transparent', width: '100%', marginTop: 4 }}
               />
             </div>
          </div>

          <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
            <img src="/flowers/sunflower.png" style={{ height: 240, objectFit: 'contain', opacity: 0.9 }} alt="Decoration" />
            
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 220, paddingLeft: 20 }}>
              {!polaroidImage ? (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: '1px solid black', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.8rem', background: 'white' }}>
                  <span>📷 Add Polaroid</span>
                  <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: 'white', padding: '8px 8px 24px 8px', border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <img src={polaroidImage} alt="Uploaded Polaroid" style={{ width: 140, height: 140, objectFit: 'cover', filter: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(0.9) hue-rotate(-5deg)' }} />
                  </div>
                  <button onClick={() => setPolaroidImage(null)} style={{ color: 'var(--postal-red)', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.8rem', marginTop: 4 }}>
                    ✕ Remove Photo
                  </button>
                </div>
              )}
            </div>

            <div style={{ width: '100%', maxWidth: 220, paddingLeft: 20 }}>
              <div style={{ border: '1px solid black', background: 'white', padding: '14px 14px 12px', fontFamily: 'var(--font-typewriter)' }}>
                <div style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8, color: 'var(--sepia-light)' }}>
                  Voice Message
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  style={{ width: '100%', border: '1px solid black', background: recordingVoice ? 'black' : 'transparent', color: recordingVoice ? 'white' : 'black', padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem', letterSpacing: '1px' }}
                >
                  {recordingVoice ? 'Stop Recording' : voicePreviewUrl ? 'Re-record Voice' : 'Record Voice'}
                </button>
                {voicePreviewUrl && (
                  <audio controls src={voicePreviewUrl} style={{ width: '100%', marginTop: 10 }} />
                )}
                {voiceClip && (
                  <div style={{ marginTop: 8, color: 'var(--sepia-light)', fontSize: '0.68rem', lineHeight: 1.5 }}>
                    Voice clip captured and ready to attach.
                  </div>
                )}
                {voicePreviewUrl && (
                  <button
                    type="button"
                    onClick={clearVoiceNote}
                    style={{ marginTop: 8, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--postal-red)' }}
                  >
                    Remove voice note
                  </button>
                )}
                {voiceError && (
                  <div style={{ marginTop: 8, color: 'var(--postal-red)', fontSize: '0.7rem', lineHeight: 1.4 }}>
                    {voiceError}
                  </div>
                )}
                {!voicePreviewUrl && !voiceError && (
                  <div style={{ marginTop: 8, color: 'var(--sepia-light)', fontSize: '0.68rem', lineHeight: 1.5 }}>
                    Record a short voice note to accompany the bouquet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '40px 0 60px' }}>
          <button onClick={() => setCurrentStep('arrange')} style={{ border: '1px solid black', background: 'transparent', padding: '10px 32px', fontFamily: 'var(--font-typewriter)', cursor: 'pointer', letterSpacing: '2px' }}>BACK</button>
          <button onClick={() => setCurrentStep('review')} style={{ border: '1px solid black', background: 'black', color: 'white', padding: '10px 32px', fontFamily: 'var(--font-typewriter)', cursor: 'pointer', letterSpacing: '2px' }}>NEXT</button>
        </div>
      </div>
    );
  }

  if (currentStep === 'review') {
    return (
       <div style={{ minHeight: '100vh', background: '#fdf6e3', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {/* Background Ornaments */}
          <img src="/flowers/lineart%20left.png" alt="" style={{ position: 'absolute', left: 0, bottom: 0, height: '420px', width: 'auto', objectFit: 'contain', pointerEvents: 'none', zIndex: 0, opacity: 0.9 }} />
          <img src="/flowers/lineart%20right.png" alt="" style={{ position: 'absolute', right: 0, bottom: 0, height: '420px', width: 'auto', objectFit: 'contain', pointerEvents: 'none', zIndex: 0, opacity: 0.9 }} />

          <div style={{ padding: '40px 0 20px', position: 'relative', zIndex: 10 }}>
            <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 60, objectFit: 'contain' }} />
          </div>
          
          <div className="font-typewriter" style={{ fontSize: '1rem', letterSpacing: '4px', margin: '0 0 40px 0', color: 'var(--ink-brown)', fontWeight: 'bold' }}>
            REVIEW YOUR CREATION
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 60, flex: 1, width: '100%', maxWidth: 1200, paddingBottom: '40px' }}>
            {/* Left Decorative Flower */}
            <div style={{ flex: 0.4, display: 'flex', justifyContent: 'flex-end', opacity: 0.9 }}>
               <img src="/flowers/lilly.png" style={{ height: 300, objectFit: 'contain' }} alt="Decoration" />
            </div>
            
            {/* Center Canvas Showcase */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 560, height: 640, background: '#f9f0dc', border: '1px solid var(--parchment-deep)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                {[...arranged].sort((a, b) => a.layer - b.layer).map(item => (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute', left: item.x - (item.isBg ? BG_SIZE : BASE_SIZE)*item.scale / 2, top: item.y - (item.isBg ? BG_SIZE : BASE_SIZE)*item.scale / 2,
                      width: (item.isBg ? BG_SIZE : BASE_SIZE)*item.scale, height: (item.isBg ? BG_SIZE : BASE_SIZE)*item.scale,
                      zIndex: item.layer, transform: `rotate(${item.rotation}deg)`, pointerEvents: 'none'
                    }}
                  >
                    <img src={`/flowers/${item.flower.file}`} alt={item.flower.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ))}

                {noteText && arranged.length > 0 && (
                  <div style={{ position: 'absolute', bottom: 30, left: 20, zIndex: 100, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))', pointerEvents: 'none' }}>
                    <div style={{ background: '#fdfbf7', width: 220, height: 130, padding: 16, border: '1px solid #ede0cc', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                      <LeafSprig style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 22, opacity: 0.35 }} />
                      <LeafSprig style={{ position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, opacity: 0.35, transform: 'scale(-1)' }} />
                      
                      <div className="font-typewriter" style={{ fontSize: '0.8rem', color: '#3b200a', fontWeight: 'bold', marginBottom: 8, position: 'relative', zIndex: 1 }}>Dear {noteRecipient},</div>
                      <div className="font-typewriter" style={{ fontSize: '0.75rem', color: '#3b200a', lineHeight: 1.5, wordWrap: 'break-word', whiteSpace: 'pre-wrap', position: 'relative', zIndex: 1 }}>
                        {noteText.split('\n').slice(0, 4).join('\n')}
                      </div>
                      <div className="font-typewriter" style={{ fontSize: '0.75rem', color: '#3b200a', fontWeight: 'bold', marginTop: 8, textAlign: 'right', position: 'relative', zIndex: 1 }}>Sincerely, {noteSender}</div>
                    </div>
                  </div>
                )}

                {polaroidImage && arranged.length > 0 && (
                  <div style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 101, transform: 'rotate(8deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.25))', pointerEvents: 'none' }}>
                    <div style={{ background: 'white', width: 160, height: 190, padding: '12px 12px 40px 12px', position: 'relative' }}>
                      <img src={polaroidImage} alt="Polaroid" style={{ width: '100%', height: 136, objectFit: 'cover', background: '#e0e0e0', display: 'block', filter: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(0.9) hue-rotate(-5deg)' }} />
                    </div>
                  </div>
                )}

                {voicePreviewUrl && arranged.length > 0 && (
                  <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 102, transform: 'rotate(4deg)', pointerEvents: 'none' }}>
                    <div style={{ background: '#fff7e8', border: '1px solid #d5c29f', padding: '8px 12px', boxShadow: '0 8px 18px rgba(0,0,0,0.14)', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', letterSpacing: '1px', color: '#5c4d3c' }}>
                      VOICE NOTE ATTACHED
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
                <button className="control-btn" onClick={() => setCurrentStep('personalize')} style={{ background: 'white', border: '1px solid black', padding: '12px 24px', letterSpacing: '1px', fontFamily: 'var(--font-typewriter)', fontSize: '0.8rem', cursor: 'pointer' }}>
                   Back to Card
                </button>
                <button className="control-btn" onClick={saveAndShareBouquet} disabled={saving} style={{ background: 'white', border: '1px solid black', padding: '12px 24px', letterSpacing: '1px', fontFamily: 'var(--font-typewriter)', fontSize: '0.8rem', cursor: 'pointer' }}>
                   {saving ? 'Saving...' : '🔗 Save & Share'}
                </button>
                <button className="btn-primary" onClick={exportPNG} style={{ padding: '12px 32px', fontSize: '0.8rem', letterSpacing: '1px', background: 'black', color: 'white', border: '1px solid black', fontFamily: 'var(--font-typewriter)', textTransform: 'uppercase', cursor: 'pointer' }}>
                   📥 Export Final Bouquet
                </button>
              </div>

              {shareUrl && (
                <div style={{ marginTop: 24, padding: '16px', border: '1px solid black', background: 'white', fontFamily: 'var(--font-typewriter)', textAlign: 'center', width: '100%', maxWidth: 450, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: 8, color: 'var(--ink-brown)' }}>BOUQUET SAVED SUCCESSFULLY!</div>
                  <div style={{ fontSize: '0.7rem', color: '#555', wordBreak: 'break-all', padding: '8px', background: '#f9f0dc', border: '1px dashed #ccc', marginBottom: 12 }}>
                    {shareUrl}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('Link copied to clipboard!');
                    }}
                    style={{ padding: '8px 20px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-typewriter)' }}
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
            
            {/* Right Decorative Flower & Voice Preview */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
               <img src="/flowers/sunflower.png" style={{ height: 240, objectFit: 'contain', opacity: 0.9 }} alt="Decoration" />
               {voicePreviewUrl && (
                 <div style={{ width: 240, background: 'white', border: '1px solid black', padding: '14px 16px', textAlign: 'left', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                   <div className="font-typewriter" style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-brown)', marginBottom: 8, fontWeight: 'bold' }}>
                     Voice Preview
                   </div>
                   <audio controls src={voicePreviewUrl} style={{ width: '100%' }} />
                 </div>
               )}
            </div>
          </div>
       </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '52px 1fr', height: '100vh', overflow: 'hidden' }}>
      {/* TOP BAR */}
      <div className="builder-topbar" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 32, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="font-typewriter" style={{ fontSize: '0.65rem', color: 'var(--parchment-deep)', letterSpacing: '1px' }}>
            {user?.displayName || user?.email}
          </span>
          <button onClick={handleSignOut} className="btn-secondary" style={{ fontSize: '0.65rem', padding: '6px 14px', color: 'var(--parchment-light)', borderColor: 'rgba(255,255,255,0.2)' }}>
            Depart
          </button>
        </div>
      </div>

      {/* TWO-PANEL + CANVAS LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', overflow: 'hidden' }}>

        {/* ── LEFT: FLOWER INVENTORY ── */}
        <div style={{ background: 'var(--parchment-light)', borderRight: '1px solid var(--parchment-deep)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Custom Filter Dropdown */}
          <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--parchment-deep)', position: 'relative' }}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '100%', padding: '8px 12px', fontSize: '0.7rem',
                fontFamily: 'var(--font-typewriter)', textTransform: 'uppercase',
                letterSpacing: '1px', color: 'var(--sepia)',
                background: 'rgba(255,255,255,0.4)', border: '1px solid var(--parchment-deep)',
                borderRadius: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
              <span>{filterCat === 'all' ? 'All Flowers' : filterCat}</span>
              <span style={{ fontSize: '0.5rem', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
            </div>
            
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% - 6px)', left: 16, right: 16, zIndex: 100,
                background: 'var(--parchment-light)', border: '1px solid var(--parchment-deep)',
                borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden'
              }}>
                {['all','primary','secondary','filler'].map((cat) => (
                  <div key={cat}
                    onClick={() => { setFilterCat(cat); setDropdownOpen(false); }}
                    className={`dropdown-option ${filterCat === cat ? 'active' : ''}`}
                    style={{
                      padding: '10px 12px', fontSize: '0.7rem', fontFamily: 'var(--font-typewriter)',
                      textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
                      background: filterCat === cat ? 'var(--sepia)' : 'transparent',
                      color: filterCat === cat ? 'var(--parchment-light)' : 'var(--sepia)',
                    }}>
                    {cat === 'all' ? 'All Flowers' : cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flower grid */}
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflowY: 'auto', flex: 1 }}>
            {filteredFlowers.map((flower) => {
              const sel = selectedFlowers.find((s) => s.flower.id === flower.id);
              return (
                <div key={flower.id} onClick={() => addFlower(flower)} title={`Add ${flower.name}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '12px 6px', cursor: 'pointer', position: 'relative',
                    opacity: sel ? 1 : 0.75,
                    transition: 'all 0.2s',
                  }}>
                  {sel && <div className="flower-count-badge">{sel.count}</div>}
                  <img src={`/flowers/${flower.file}`} alt={flower.name} width={72} height={72} style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }} />
                  <span className="font-typewriter" style={{ fontSize: '0.65rem', color: 'var(--sepia)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.3 }}>{flower.name}</span>
                </div>
              );
            })}
          </div>

          {/* Selected summary */}
          {selectedFlowers.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--parchment-deep)', background: 'rgba(255,255,255,0.25)' }}>
              {selectedFlowers.map(({ flower, count }) => (
                <div key={flower.id} onClick={() => removeFlowerFromSelection(flower.id)} title="Click to remove"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, cursor: 'pointer', padding: '4px 6px', borderRadius: 4, transition: 'background 0.2s' }}>
                  <span className="font-typewriter" style={{ fontSize: '0.7rem', color: 'var(--ink-brown)' }}>{flower.name} × {count}</span>
                  <span style={{ color: 'var(--postal-red)', fontSize: '0.85rem' }}>✕</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CENTER: CANVAS ── */}
        <div className="builder-canvas-area" style={{ flexDirection: 'column' }}>
          <div ref={canvasRef} className="bouquet-canvas" onClick={() => setActiveFlower(null)}>


            {arranged.length === 0 && (
              <div className="canvas-placeholder">
                <div className="canvas-placeholder-icon">💐</div>
                <div className="canvas-placeholder-text">
                  Select flowers from the<br />inventory, then press<br />Auto Arrange
                </div>
              </div>
            )}

            {/* Red ribbon tie removed per user request */}

            {/* Flowers — sorted by layer so fillers render behind */}
            {[...arranged].sort((a, b) => a.layer - b.layer).map((item) => (
              <BouquetFlower
                key={item.id}
                item={item}
                isActive={activeFlower === item.id}
                onClick={(e) => { e.stopPropagation(); setActiveFlower(item.id); }}
                onDrag={(dx, dy) => {
                  setArranged((prev) => prev.map((f) => f.id === item.id ? { ...f, x: f.x + dx, y: f.y + dy } : f));
                }}
              />
            ))}

            {/* Note Card Overlay */}
            {noteText && arranged.length > 0 && (
              <div style={{ position: 'absolute', bottom: 30, left: 20, zIndex: 100, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))', pointerEvents: 'none' }}>
                <div style={{ background: '#fdfbf7', width: 220, height: 130, padding: 16, border: '1px solid #ede0cc', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                  <LeafSprig style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 22, opacity: 0.35 }} />
                  <LeafSprig style={{ position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, opacity: 0.35, transform: 'scale(-1)' }} />
                  
                  <div className="font-typewriter" style={{ fontSize: '0.8rem', color: '#3b200a', fontWeight: 'bold', marginBottom: 8, position: 'relative', zIndex: 1 }}>Dear {noteRecipient},</div>
                  <div className="font-typewriter" style={{ fontSize: '0.75rem', color: '#3b200a', lineHeight: 1.5, wordWrap: 'break-word', whiteSpace: 'pre-wrap', position: 'relative', zIndex: 1 }}>
                    {noteText.split('\n').slice(0, 4).join('\n')}
                  </div>
                  <div className="font-typewriter" style={{ fontSize: '0.75rem', color: '#3b200a', fontWeight: 'bold', marginTop: 8, textAlign: 'right', position: 'relative', zIndex: 1 }}>Sincerely, {noteSender}</div>
                </div>
              </div>
            )}

            {/* Polaroid Tag Overlay */}
            {polaroidImage && arranged.length > 0 && (
              <div style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 101, transform: 'rotate(8deg)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.25))', pointerEvents: 'none' }}>
                <div style={{ background: 'white', width: 160, height: 190, padding: '12px 12px 40px 12px', position: 'relative' }}>
                  <img src={polaroidImage} alt="Polaroid" style={{ width: '100%', height: 136, objectFit: 'cover', background: '#e0e0e0', display: 'block', filter: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(0.9) hue-rotate(-5deg)' }} />
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setCurrentStep('personalize')} id="btn-next-step" style={{ marginTop: 24, border: '1px solid black', background: 'black', color: 'white', padding: '12px 40px', fontFamily: 'var(--font-typewriter)', cursor: 'pointer', letterSpacing: '2px', fontWeight: 'bold' }}>
            NEXT ➔
          </button>
        </div>

        {/* ── RIGHT: TOOLS ── */}
        <div style={{ background: 'var(--parchment-light)', borderLeft: '1px solid var(--parchment-deep)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Quick actions */}
          <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--parchment-deep)' }}>
            <div className="font-typewriter" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--sepia-light)', marginBottom: 10 }}>Arrange</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={autoArrange} id="btn-auto-arrange" title="Auto Arrange"
                style={{ flex: 1, padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.2s', letterSpacing: '0.5px' }}>
                ✦ Auto
              </button>
              <button onClick={shuffleArrangement} id="btn-shuffle" title="Shuffle"
                style={{ flex: 1, padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.2s', letterSpacing: '0.5px' }}>
                ⟳ Shuffle
              </button>
              <button onClick={clearAll} id="btn-clear" title="Clear All"
                style={{ padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--postal-red)', transition: 'all 0.2s' }}>
                ✕
              </button>
            </div>
          </div>

          {/* Greenery */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--parchment-deep)' }}>
            <div className="font-typewriter" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--sepia-light)', marginBottom: 10 }}>Greenery</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['greenery1.png','greenery2.png','greenery3.png','greenery4.png','greenery5.png'].map((file, idx) => (
                <button
                  key={file}
                  id={`btn-greenery-${idx + 1}`}
                  onClick={() => changeGreenery(file)}
                  title={`Greenery ${idx + 1}`}
                  style={{
                    flex: 1, padding: 3, border: 'none',
                    background: selectedGreenery === file ? 'var(--parchment-dark)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s', opacity: selectedGreenery === file ? 1 : 0.6,
                  }}
                >
                  <img src={`/flowers/${file}`} alt={`Greenery ${idx + 1}`} style={{ width: '100%', height: 38, objectFit: 'cover', borderRadius: 3 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Flower editing tools */}
          <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto' }}>
            <div className="font-typewriter" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: activeFlower ? 'var(--sepia)' : 'var(--sepia-light)', marginBottom: 12 }}>
              {activeFlower ? '✦ Editing Flower' : 'Select a flower'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, opacity: activeFlower ? 1 : 0.35, pointerEvents: activeFlower ? 'auto' : 'none' }}>
              <button onClick={() => rotateActive(-15)} id="btn-rotate-left" title="Rotate Left"
                style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.15s' }}>
                ↺ Rotate
              </button>
              <button onClick={() => rotateActive(15)} id="btn-rotate-right" title="Rotate Right"
                style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.15s' }}>
                ↻ Rotate
              </button>
              <button onClick={() => resizeActive(0.1)} id="btn-enlarge" title="Enlarge"
                style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.15s' }}>
                ⊕ Bigger
              </button>
              <button onClick={() => resizeActive(-0.1)} id="btn-shrink" title="Shrink"
                style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.15s' }}>
                ⊖ Smaller
              </button>
              <button onClick={() => moveLayer(1)} id="btn-layer-up" title="Move Forward"
                style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.15s' }}>
                ⇧ Forward
              </button>
              <button onClick={() => moveLayer(-1)} id="btn-layer-down" title="Move Backward"
                style={{ padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: 'var(--sepia)', transition: 'all 0.15s' }}>
                ⇩ Back
              </button>
            </div>
            <button onClick={deleteActive} disabled={!activeFlower} id="btn-delete"
              style={{ width: '100%', marginTop: 8, padding: '10px 0', border: 'none', background: 'transparent', cursor: activeFlower ? 'pointer' : 'default', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', color: activeFlower ? 'var(--postal-red)' : 'var(--sepia-light)', transition: 'all 0.15s', opacity: activeFlower ? 1 : 0.35 }}>
              🗑 Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Draggable Flower Component ── */
function BouquetFlower({ item, isActive, onClick, onDrag }) {
  const ref = useRef(null);
  const dragStart = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    dragStart.current = { mx: e.clientX, my: e.clientY };
    const onMove = (ev) => {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      dragStart.current = { mx: ev.clientX, my: ev.clientY };
      onDrag(dx, dy);
    };
    const onUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // bg greenery images use BG_SIZE, everything else uses BASE_SIZE
  const base = item.isBg ? BG_SIZE : BASE_SIZE;
  const sz = base * item.scale;
  return (
    <div
      ref={ref}
      className={`bouquet-flower${isActive ? ' dragging' : ''}`}
      style={{
        left: item.x - sz / 2,
        top: item.y - sz / 2,
        width: sz,
        height: sz,
        zIndex: isActive ? 999 : item.layer,
        transform: `rotate(${item.rotation}deg)`,
        outline: isActive ? '2px dashed var(--gold-light)' : 'none',
        outlineOffset: 6,
        borderRadius: 4,
        transition: 'outline 0.15s ease',
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      <img
        src={`/flowers/${item.flower.file}`}
        alt={item.flower.name}
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }}
      />
    </div>
  );
}