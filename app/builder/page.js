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

const FILTER_PRESETS = [
  {
    id: 'original',
    name: 'Original',
    filter: 'none',
    overlayColor: null,
    overlayBlendMode: null,
    overlayOpacity: 0,
    grainOpacity: 0,
    vignette: false,
    blur: false,
    description: 'No filters applied'
  },
  {
    id: 'floravo',
    name: 'Floravo Signature',
    filter: 'brightness(1.05) contrast(0.92) saturate(0.82) sepia(0.1)',
    overlayColor: '#f4ebdb',
    overlayBlendMode: 'multiply',
    overlayOpacity: 0.12,
    grainOpacity: 0.03,
    vignette: true,
    blur: false,
    description: 'Pressed flowers & warm luxury memories'
  },
  {
    id: 'soft_romantic',
    name: 'Soft Romantic Vintage ⭐',
    filter: 'sepia(0.12) saturate(0.85) contrast(0.92) brightness(1.05)',
    overlayColor: '#f5ecd4',
    overlayBlendMode: 'multiply',
    overlayOpacity: 0.12,
    grainOpacity: 0.0,
    vignette: false,
    blur: false,
    description: 'Creamy whites & soft romantic tones'
  },
  {
    id: 'antique',
    name: 'Antique Letter Look',
    filter: 'sepia(0.25) contrast(0.90) brightness(1.03) saturate(0.75)',
    overlayColor: null,
    overlayBlendMode: null,
    overlayOpacity: 0.0,
    grainOpacity: 0.06,
    vignette: false,
    blur: false,
    description: 'Century-old vintage postcard feel'
  },
  {
    id: 'film_90s',
    name: 'Film Camera 1990s',
    filter: 'contrast(0.95) brightness(1.08) saturate(0.90) sepia(0.08)',
    overlayColor: null,
    overlayBlendMode: null,
    overlayOpacity: 0.0,
    grainOpacity: 0.0,
    vignette: false,
    blur: true,
    description: 'Soft focus nostalgic memory vibe'
  },
  {
    id: 'pressed_flower',
    name: 'Pressed Flower Journal 🌸',
    filter: 'brightness(1.08) contrast(0.88) saturate(0.82) sepia(0.10)',
    overlayColor: '#f6f1e7',
    overlayBlendMode: 'soft-light',
    overlayOpacity: 1.0,
    grainOpacity: 0.0,
    vignette: false,
    blur: false,
    description: 'Muted greens & botanical journal style'
  },
  {
    id: 'luxury_editorial',
    name: 'Luxury Editorial',
    filter: 'brightness(1.05) contrast(0.90) saturate(0.75)',
    overlayColor: null,
    overlayBlendMode: null,
    overlayOpacity: 0.0,
    grainOpacity: 0.0,
    vignette: false,
    blur: false,
    opacity: 0.96,
    description: 'Premium minimal Vogue photoshoot feel'
  }
];

const BASE_FLOWER_SIZE = BASE_SIZE;

export default function BuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isApproved, setIsApproved] = useState(null);
  const [userRecord, setUserRecord] = useState(null);
  const [checkingApproval, setCheckingApproval] = useState(true);
  const [myBouquet, setMyBouquet] = useState(null);
  const [checkingMyBouquet, setCheckingMyBouquet] = useState(true);
  const [deletingBouquet, setDeletingBouquet] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
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
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (voicePreviewUrl) {
      audioRef.current = new Audio(voicePreviewUrl);
      audioRef.current.addEventListener('ended', () => setIsPlayingVoice(false));
    } else {
      audioRef.current = null;
    }
    setIsPlayingVoice(false);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [voicePreviewUrl]);
  const [currentStep, setCurrentStep] = useState('arrange');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  // ── Feedback modal state ──
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    shared: '',
    meaningfulness: 0,
    frustrations: '',
    wishFeature: '',
    wouldUseAgain: '',
  });
  const [feedbackStep, setFeedbackStep] = useState(1); // 1-5
  const mediaRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);

  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [polaroidError, setPolaroidError] = useState('');

  const [cropperStep, setCropperStep] = useState('crop'); // 'crop' or 'filter'
  const [croppedTempDataUrl, setCroppedTempDataUrl] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('floravo');

  const recordingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [voiceSecondsLeft, setVoiceSecondsLeft] = useState(15);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setPolaroidError('Image file is too large (maximum 5MB).');
        return;
      }
      setPolaroidError('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropImageSrc(event.target.result);
        setCropperStep('crop');
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!cropImageSrc) return;
    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      let w = 200;
      let h = 200;
      if (aspect > 1) {
        h = 200;
        w = 200 * aspect;
      } else {
        w = 200;
        h = 200 / aspect;
      }
      setImgWidth(w);
      setImgHeight(h);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = cropImageSrc;
  }, [cropImageSrc]);

  const handleCropNext = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      const renderedW = imgWidth * zoom;
      const renderedH = imgHeight * zoom;

      const renderedLeft = (200 - renderedW) / 2 + offset.x;
      const renderedTop = (200 - renderedH) / 2 + offset.y;

      const scaleX = img.width / renderedW;
      const scaleY = img.height / renderedH;

      const sx = -renderedLeft * scaleX;
      const sy = -renderedTop * scaleY;
      const sWidth = 200 * scaleX;
      const sHeight = 200 * scaleY;

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 400, 400);
      setCroppedTempDataUrl(canvas.toDataURL('image/jpeg', 0.95));
      setCropperStep('filter');
    };
    img.src = cropImageSrc;
  };

  const handleFilterSave = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      const preset = FILTER_PRESETS.find(p => p.id === selectedPresetId) || FILTER_PRESETS[0];

      // Draw base image
      ctx.drawImage(img, 0, 0, 400, 400);

      // Apply CSS filter
      if (preset.filter && preset.filter !== 'none') {
        ctx.clearRect(0, 0, 400, 400);
        ctx.save();
        ctx.filter = preset.filter;
        ctx.drawImage(img, 0, 0, 400, 400);
        ctx.restore();
      }

      // Apply matte effect (opacity 96%)
      if (preset.opacity !== undefined) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.restore();

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        ctx.clearRect(0, 0, 400, 400);
        ctx.save();
        ctx.globalAlpha = preset.opacity;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }

      // Apply overlay color
      if (preset.overlayColor) {
        ctx.save();
        ctx.globalCompositeOperation = preset.overlayBlendMode || 'source-over';
        ctx.fillStyle = preset.overlayColor;
        ctx.globalAlpha = preset.overlayOpacity || 1.0;
        ctx.fillRect(0, 0, 400, 400);
        ctx.restore();
      }

      // Apply vignette
      if (preset.vignette) {
        ctx.save();
        const grad = ctx.createRadialGradient(200, 200, 200 * 0.65, 200, 200, 200);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 400);
        ctx.restore();
      }

      // Apply grain
      if (preset.grainOpacity > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = preset.grainOpacity;
        const imgData = ctx.getImageData(0, 0, 400, 400);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 50;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
        }
        ctx.putImageData(imgData, 0, 0);
        ctx.restore();
      }

      setPolaroidImage(canvas.toDataURL('image/jpeg', 0.9));
      setShowCropper(false);
      setCropImageSrc('');
      setCroppedTempDataUrl('');
      setCropperStep('crop');
    };
    img.src = croppedTempDataUrl;
  };

  useEffect(() => {
    return () => {
      if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [voicePreviewUrl]);

  const clearVoiceNote = () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl);
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setVoiceClip(null);
    setVoicePreviewUrl('');
    setVoiceError('');
    setRecordingVoice(false);
    setVoiceSecondsLeft(15);
    voiceChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

  const startVoiceRecording = async () => {
    setVoiceError('');
    setVoiceSecondsLeft(15);

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

        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      setRecordingVoice(true);
      recorder.start();

      recordingIntervalRef.current = setInterval(() => {
        setVoiceSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      recordingTimeoutRef.current = setTimeout(() => {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 15000);

    } catch (error) {
      setVoiceError(error?.name === 'NotAllowedError'
        ? 'Microphone permission was denied.'
        : 'Could not start voice recording.');
      setRecordingVoice(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const toggleVoiceRecording = () => {
    if (recordingVoice) stopVoiceRecording();
    else startVoiceRecording();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace('/');
      } else {
        setUser(u);
        try {
          const token = await u.getIdToken(true);
          const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiHost}/api/auth/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            setUserRecord(data.user);
            setIsApproved(data.user.approved);
            if (data.user.approved) {
              try {
                const bResponse = await fetch(`${apiHost}/api/bouquets/my-bouquet`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                const bData = await bResponse.json();
                if (bData.success && bData.bouquet) {
                  setMyBouquet(bData.bouquet);
                }
              } catch (bErr) {
                console.error('Failed to fetch user bouquet:', bErr);
              } finally {
                setCheckingMyBouquet(false);
              }
            } else {
              setCheckingMyBouquet(false);
            }
          } else {
            console.error('Failed to sync user auth status:', data.error);
            setIsApproved(false);
            setCheckingMyBouquet(false);
          }
        } catch (err) {
          console.error('Auth sync error:', err);
          setIsApproved(false);
          setCheckingMyBouquet(false);
        } finally {
          setCheckingApproval(false);
          setCheckingAuth(false);
        }
      }
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

  // Open feedback modal 1s after share URL appears
  useEffect(() => {
    if (shareUrl && !feedbackSubmitted) {
      const t = setTimeout(() => setShowFeedback(true), 1000);
      return () => clearTimeout(t);
    }
  }, [shareUrl, feedbackSubmitted]);

  const submitFeedback = async () => {
    setFeedbackSubmitting(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let token = null;
      try { token = await auth.currentUser?.getIdToken(true); } catch (_) {}
      // Extract bouquet ID from shareUrl
      const bouquetId = shareUrl ? shareUrl.split('/').pop() : null;
      await fetch(`${apiHost}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...feedbackData, bouquetId })
      });
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setFeedbackSubmitting(false);
      setFeedbackSubmitted(true);
      setShowFeedback(false);
    }
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

      const token = await auth.currentUser.getIdToken(true);
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/bouquets`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        setShareUrl(`${origin}/view/${data.id}`);
        setMyBouquet({
          _id: data.id,
          noteRecipient,
          noteSender,
          noteText,
          arranged: payload.arranged,
          polaroidImage,
          voiceNote: voiceNoteBase64
        });
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

  const handleDeleteMyBouquet = async () => {
    if (!myBouquet) return;
    if (!confirm("Are you sure you want to delete your current bouquet? This cannot be undone.")) {
      return;
    }
    setDeletingBouquet(true);
    try {
      const u = auth.currentUser;
      if (!u) return;
      const token = await u.getIdToken(true);
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiHost}/api/bouquets/${myBouquet._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyBouquet(null);
        alert("Bouquet deleted successfully! You can now create a new one.");
      } else {
        alert("Failed to delete bouquet: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Delete bouquet error:", err);
      alert("An error occurred while deleting the bouquet.");
    } finally {
      setDeletingBouquet(false);
    }
  };

  const filteredFlowers = filterCat === 'all' ? FLOWERS : FLOWERS.filter((f) => f.category === filterCat);

  if (checkingAuth || checkingApproval) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="font-typewriter text-sepia" style={{ fontSize: '0.8rem', letterSpacing: '3px' }}>Opening the Atelier…</span>
    </div>
  );

  if (!isApproved) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--parchment-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 40, objectFit: 'contain' }} />
        </div>
        
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24
        }}>
          <button onClick={handleSignOut} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '8px 18px', fontWeight: 'bold' }}>
            Depart
          </button>
        </div>

        <div className="letter-card animate-fadeInUp" style={{
          width: '100%',
          maxWidth: 500,
          padding: '48px 48px 40px',
          position: 'relative',
        }}>
          <div className="letter-card-inner" style={{ padding: '36px' }}>
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <div className="font-typewriter" style={{ fontSize: '0.6rem', color: 'var(--sepia-light)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 8 }}>
                Private Beta Verification
              </div>
              <h2 className="font-display" style={{ fontSize: '1.6rem', color: 'var(--ink-brown)', fontWeight: 600, lineHeight: 1.2 }}>
                Pending Authorization
              </h2>
              <p className="font-script" style={{ fontSize: '1.1rem', color: 'var(--sepia)', fontStyle: 'italic', marginTop: 8 }}>
                "Entry is reserved for registered invitees of our Atelier."
              </p>
            </div>

            <div className="ornament-divider" style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '0.9rem' }}>❧</span>
            </div>

            <div className="font-typewriter" style={{ fontSize: '0.75rem', color: 'var(--sepia)', lineHeight: 1.6, marginBottom: 20, textAlign: 'justify' }}>
              Your account for <strong>{user?.email}</strong> has been registered but requires administrator approval to enter the bouquet builder. 
              If you have received a Beta Invite Code, please enter it below for immediate access.
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!inviteCode.trim()) return;
              setInviteSubmitting(true);
              setInviteError('');
              try {
                const token = await auth.currentUser.getIdToken(true);
                const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiHost}/api/auth/claim-invite`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ inviteCode: inviteCode.trim() })
                });
                const data = await response.json();
                if (data.success) {
                  setIsApproved(true);
                  setUserRecord(data.user);
                } else {
                  setInviteError(data.error || 'Invalid invite code.');
                }
              } catch (err) {
                console.error(err);
                setInviteError('Failed to verify invite code. Please try again.');
              } finally {
                setInviteSubmitting(false);
              }
            }}>
              <div className="input-wrapper">
                <label className="input-label" htmlFor="inviteCode">Beta Invite Code</label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  className="vintage-input"
                  placeholder="e.g. FLORAVO-BETA-001"
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value); setInviteError(''); }}
                  required
                  style={{ textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}
                  disabled={inviteSubmitting}
                />
              </div>

              {inviteError && (
                <div className="error-msg" role="alert" style={{ marginTop: 12 }}>
                  ⚠ {inviteError}
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={inviteSubmitting}
                  style={{ width: '100%' }}
                >
                  {inviteSubmitting ? 'Verifying Invite…' : '✉ Verify & Enter'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--parchment-deep)', textAlign: 'center' }}>
              <span className="font-typewriter" style={{ fontSize: '0.65rem', color: 'var(--sepia-light)' }}>
                Need access? Please contact <a href="mailto:info@floravo.com" style={{ textDecoration: 'underline', color: 'var(--sepia)' }}>info@floravo.com</a>.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (myBouquet && !shareUrl) {
    const bouquetViewUrl = typeof window !== 'undefined' ? `${window.location.origin}/view/${myBouquet._id}` : '';
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--parchment-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(212,185,122,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(212,185,122,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{
          position: 'absolute',
          top: 24,
          left: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 40, objectFit: 'contain' }} />
        </div>
        
        {/* Sign Out */}
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24
        }}>
          <button onClick={handleSignOut} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '8px 18px', fontWeight: 'bold' }}>
            Depart
          </button>
        </div>

        <div className="letter-card animate-fadeInUp" style={{
          width: '100%',
          maxWidth: 540,
          padding: '48px 48px 40px',
          position: 'relative',
        }}>
          <div className="letter-card-inner" style={{ padding: '16px' }}>
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <div className="font-typewriter" style={{ fontSize: '0.6rem', color: 'var(--sepia-light)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 8 }}>
                Artisan Registry
              </div>
              <h2 className="font-display" style={{ fontSize: '1.6rem', color: 'var(--ink-brown)', fontWeight: 600, lineHeight: 1.2 }}>
                One Creation Limit
              </h2>
              <p className="font-script" style={{ fontSize: '1.1rem', color: 'var(--sepia)', fontStyle: 'italic', marginTop: 8 }}>
                "Each patron may hold but one active bouquet in our gallery."
              </p>
            </div>

            <div className="ornament-divider" style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '0.9rem' }}>❧</span>
            </div>

            <div className="font-typewriter" style={{ fontSize: '0.75rem', color: 'var(--sepia)', lineHeight: 1.7, marginBottom: 24, textAlign: 'justify' }}>
              To ensure our digital gardens remain pristine and accessible to all, Floravo limits standard members to <strong>one active bouquet creation</strong>. You have already crafted a beautiful arrangement!
            </div>

            <div style={{ 
              background: '#fcf8ee', 
              border: '1px dashed var(--parchment-deep)', 
              padding: '16px', 
              borderRadius: '4px',
              marginBottom: 28,
              textAlign: 'center'
            }}>
              <div className="font-typewriter" style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--ink-brown)', marginBottom: 8, letterSpacing: '1px' }}>
                YOUR ACTIVE BOUQUET LINK
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'var(--sepia)', 
                wordBreak: 'break-all', 
                padding: '10px', 
                background: '#f2e4c0', 
                border: '1px solid var(--parchment-deep)', 
                marginBottom: 12,
                fontFamily: 'var(--font-typewriter)'
              }}>
                {bouquetViewUrl}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bouquetViewUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.68rem' }}
                >
                  Copy Link
                </button>
                <a 
                  href={bouquetViewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.68rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  View Creation
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleDeleteMyBouquet}
                disabled={deletingBouquet}
                className="btn-primary"
                style={{ 
                  background: 'var(--postal-red)', 
                  borderColor: 'var(--postal-red)',
                  color: 'white',
                  width: '100%' 
                }}
              >
                {deletingBouquet ? 'Tearing down bouquet...' : '🗑 Delete Bouquet & Start Anew'}
              </button>
              <div className="font-typewriter" style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', textAlign: 'center', fontStyle: 'italic' }}>
                *Deleting this will deactivate the link above permanently.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'personalize') {
    return (
      <div style={{ minHeight: '100vh', background: '#fdf6e3', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ padding: '40px 0 20px', position: 'relative', zIndex: 10 }}>
          <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo Logo" style={{ height: 60, objectFit: 'contain' }} />
        </div>
        
        <div className="font-typewriter" style={{ fontSize: '1rem', letterSpacing: '4px', margin: '0 0 40px 0', color: 'var(--ink-brown)', fontWeight: 'bold', zIndex: 10 }}>
          WRITE THE CARD
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 60, flex: 1, width: '100%', maxWidth: 1100, position: 'relative', zIndex: 10 }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', opacity: 0.9 }}>
             <img src="/flowers/lilly.png" style={{ height: 300, objectFit: 'contain' }} alt="Decoration" />
          </div>
          
          <div style={{ background: 'white', border: '2px solid black', padding: '40px', width: 420, minHeight: 400, display: 'flex', flexDirection: 'column', boxShadow: 'none', position: 'relative' }}>
             <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                 <div className="font-typewriter" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'black' }}>Dear </div>
                 <input 
                   value={noteRecipient} 
                   onChange={e => setNoteRecipient(e.target.value)} 
                   style={{ border: 'none', borderBottom: '1px dashed #999', outline: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '1.2rem', color: 'black', marginLeft: 8, flex: 1, background: 'transparent' }}
                 />
                 <span className="font-typewriter" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'black' }}>,</span>
               </div>
               <textarea 
                 value={noteText} onChange={e => setNoteText(e.target.value)}
                 maxLength={120}
                 style={{ flex: 1, border: 'none', resize: 'none', outline: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '1.05rem', color: 'black', lineHeight: '1.6', background: 'transparent' }}
                 placeholder="I have so much to tell you, but only this much space on this card! Still, you must know..."
               />
               <div className="font-typewriter" style={{ fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right', marginTop: 20, color: 'black' }}>Sincerely,</div>
               <input 
                 value={noteSender} 
                 onChange={e => setNoteSender(e.target.value)}
                 style={{ border: 'none', borderBottom: '1px dashed #999', outline: 'none', fontFamily: 'var(--font-typewriter)', fontSize: '1.2rem', color: 'black', textAlign: 'right', background: 'transparent', width: '100%', marginTop: 4 }}
               />
               <div style={{ borderBottom: '1px dashed #ccc', marginTop: 24 }} />
             </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
            <img src="/flowers/sunflower.png" style={{ height: 240, objectFit: 'contain', opacity: 0.9 }} alt="Decoration" />
            
            <div style={{ textAlign: 'left', width: '100%', maxWidth: 220 }}>
              {!polaroidImage ? (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', border: '1px solid black', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.8rem', background: 'white', width: '100%' }}>
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
              {polaroidError && (
                <div style={{ color: 'var(--postal-red)', fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem', marginTop: 6, lineHeight: 1.4 }}>
                  {polaroidError}
                </div>
              )}
            </div>
 
            <div style={{ width: '100%', maxWidth: 220, fontFamily: 'var(--font-typewriter)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8, color: 'var(--sepia-light)' }}>
                Voice Message
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
                <img
                  src="/recorder.png"
                  alt="Recorder"
                  className={recordingVoice ? 'shaky-recorder' : ''}
                  style={{
                    height: '85px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={toggleVoiceRecording}
                style={{ width: '100%', border: '1px solid black', background: recordingVoice ? 'var(--postal-red)' : 'transparent', color: recordingVoice ? 'white' : 'black', padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem', letterSpacing: '1px' }}
              >
                {recordingVoice ? `■ Stop (${voiceSecondsLeft}s)` : voicePreviewUrl ? '● Re-record Voice' : '● Record Voice'}
              </button>
              {voicePreviewUrl && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!audioRef.current) return;
                        if (isPlayingVoice) {
                          audioRef.current.pause();
                          setIsPlayingVoice(false);
                        } else {
                          audioRef.current.play().catch(e => console.error(e));
                          setIsPlayingVoice(true);
                        }
                      }}
                      style={{
                        flex: 1,
                        border: '1px solid black',
                        background: 'transparent',
                        padding: '6px 12px',
                        fontFamily: 'var(--font-typewriter)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {isPlayingVoice ? '❚❚ Pause' : '▶ Play'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!audioRef.current) return;
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setIsPlayingVoice(false);
                      }}
                      style={{
                        flex: 1,
                        border: '1px solid black',
                        background: 'transparent',
                        padding: '6px 12px',
                        fontFamily: 'var(--font-typewriter)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        letterSpacing: '1px'
                      }}
                    >
                      ■ Stop
                    </button>
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginTop: 6 }}>
                    {isPlayingVoice ? 'Playback active' : 'Playback idle'}
                  </div>
                </div>
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
 
        <div style={{ display: 'flex', gap: 16, padding: '40px 0 60px', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <button onClick={() => setCurrentStep('arrange')} style={{ border: '1px solid black', background: 'white', color: 'black', padding: '10px 32px', fontFamily: 'var(--font-typewriter)', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' }}>BACK</button>
          <button onClick={() => setCurrentStep('review')} style={{ border: '1px solid black', background: 'black', color: 'white', padding: '10px 32px', fontFamily: 'var(--font-typewriter)', cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' }}>NEXT</button>
        </div>

        {/* Cropper Modal Overlay */}
        {showCropper && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)'
          }}>
            <div style={{
              background: '#fdfbf7',
              border: '2px solid black',
              padding: '24px',
              width: '340px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-typewriter)',
              position: 'relative'
            }}>
              {cropperStep === 'crop' ? (
                <>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px', color: 'black', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Crop Your Photo
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#666', marginBottom: '16px', textAlign: 'center', lineHeight: 1.4 }}>
                    Drag the image to adjust position,<br />use the slider below to zoom.
                  </div>

                  {/* Cropper Frame Container (200x200) */}
                  <div 
                    style={{
                      position: 'relative',
                      width: 200,
                      height: 200,
                      overflow: 'hidden',
                      border: '2px solid black',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      background: '#eee',
                      touchAction: 'none'
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setIsDragging(true);
                      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
                    }}
                    onPointerMove={(e) => {
                      if (!isDragging) return;
                      setOffset({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y
                      });
                    }}
                    onPointerUp={() => setIsDragging(false)}
                    onPointerCancel={() => setIsDragging(false)}
                  >
                    <img
                      src={cropImageSrc}
                      alt="Crop Preview"
                      draggable={false}
                      style={{
                        position: 'absolute',
                        width: imgWidth * zoom,
                        height: imgHeight * zoom,
                        left: (200 - imgWidth * zoom) / 2 + offset.x,
                        top: (200 - imgHeight * zoom) / 2 + offset.y,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        filter: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(0.9) hue-rotate(-5deg)'
                      }}
                    />
                    {/* Subtle grid lines in crop window to help alignment */}
                    <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(255,255,255,0.45)', pointerEvents: 'none' }} />
                  </div>

                  {/* Zoom Slider */}
                  <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'black', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <span>Zoom</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      style={{
                        width: '100%',
                        accentColor: 'black',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                    <button
                      onClick={() => {
                        setShowCropper(false);
                        setCropImageSrc('');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        border: '1px solid black',
                        background: 'white',
                        color: 'black',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-typewriter)',
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCropNext}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        border: '1px solid black',
                        background: 'black',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-typewriter)',
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px', color: 'black', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Vintage Presets
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#666', marginBottom: '16px', textAlign: 'center', lineHeight: 1.4 }}>
                    Choose a vintage photo preset formula.
                  </div>

                  {/* Filter Preview Box (200x200) */}
                  <div 
                    style={{
                      position: 'relative',
                      width: 200,
                      height: 200,
                      overflow: 'hidden',
                      border: '2px solid black',
                      background: '#eee'
                    }}
                  >
                    {/* Base Image with CSS filters */}
                    <img
                      src={croppedTempDataUrl}
                      alt="Filter Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: `${FILTER_PRESETS.find(p => p.id === selectedPresetId)?.filter || 'none'}${FILTER_PRESETS.find(p => p.id === selectedPresetId)?.blur ? ' blur(0.5px)' : ''}`,
                        opacity: FILTER_PRESETS.find(p => p.id === selectedPresetId)?.opacity !== undefined ? FILTER_PRESETS.find(p => p.id === selectedPresetId)?.opacity : 1
                      }}
                    />

                    {/* Color Overlay */}
                    {FILTER_PRESETS.find(p => p.id === selectedPresetId)?.overlayColor && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: FILTER_PRESETS.find(p => p.id === selectedPresetId)?.overlayColor,
                        opacity: FILTER_PRESETS.find(p => p.id === selectedPresetId)?.overlayOpacity,
                        mixBlendMode: FILTER_PRESETS.find(p => p.id === selectedPresetId)?.overlayBlendMode,
                        pointerEvents: 'none'
                      }} />
                    )}

                    {/* Vignette Overlay */}
                    {FILTER_PRESETS.find(p => p.id === selectedPresetId)?.vignette && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle, transparent 65%, rgba(0,0,0,0.08) 100%)',
                        pointerEvents: 'none'
                      }} />
                    )}

                    {/* Grain Overlay */}
                    {(FILTER_PRESETS.find(p => p.id === selectedPresetId)?.grainOpacity || 0) > 0 && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: (FILTER_PRESETS.find(p => p.id === selectedPresetId)?.grainOpacity || 0) * 2.5,
                        mixBlendMode: 'overlay',
                        pointerEvents: 'none',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                      }} />
                    )}
                  </div>

                  {/* Scrollable Preset Selector List */}
                  <div style={{ width: '100%', height: '140px', overflowY: 'auto', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', border: '1px solid #ddd', padding: '6px', background: 'white' }}>
                    {FILTER_PRESETS.map((preset) => {
                      const isActive = preset.id === selectedPresetId;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => setSelectedPresetId(preset.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px 10px',
                            border: isActive ? '2px solid black' : '1px solid #eee',
                            background: isActive ? '#f9f6f0' : 'transparent',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-typewriter)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'black' }}>
                            {preset.name}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: '#666', marginTop: '3px', lineHeight: 1.3 }}>
                            {preset.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '20px' }}>
                    <button
                      onClick={() => setCropperStep('crop')}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        border: '1px solid black',
                        background: 'white',
                        color: 'black',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-typewriter)',
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFilterSave}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        border: '1px solid black',
                        background: 'black',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-typewriter)',
                        fontSize: '0.75rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 'review') {
    return (
       <div style={{ minHeight: '100vh', background: '#fdf6e3', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <style>{`
            @keyframes shaky {
              0% { transform: translate(0, 0) rotate(0deg); }
              10% { transform: translate(-1.5px, -1.5px) rotate(-1deg); }
              20% { transform: translate(-2.5px, 0px) rotate(1.5deg); }
              30% { transform: translate(1.5px, 1.5px) rotate(0deg); }
              40% { transform: translate(1.5px, -1.5px) rotate(1deg); }
              50% { transform: translate(-1.5px, 2.5px) rotate(-1.5deg); }
              60% { transform: translate(-2.5px, 1.5px) rotate(0deg); }
              70% { transform: translate(2.5px, 1.5px) rotate(-1deg); }
              80% { transform: translate(-1.5px, -1.5px) rotate(1.5deg); }
              90% { transform: translate(1.5px, 2.5px) rotate(0deg); }
              100% { transform: translate(1.5px, -2.5px) rotate(-1deg); }
            }
            .shaky-recorder {
              animation: shaky 0.12s infinite;
            }
          `}</style>
          
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
              
              <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
                <button 
                  onClick={() => setCurrentStep('personalize')} 
                  style={{ 
                    background: 'white', 
                    color: 'black',
                    border: '1px solid black', 
                    padding: '12px 32px', 
                    letterSpacing: '2px', 
                    fontFamily: 'var(--font-typewriter)', 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f7f7f7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Back to Card
                </button>
                <button 
                  onClick={saveAndShareBouquet} 
                  disabled={saving} 
                  style={{ 
                    background: 'black', 
                    color: 'white',
                    border: '1px solid black', 
                    padding: '12px 48px', 
                    letterSpacing: '2px', 
                    fontFamily: 'var(--font-typewriter)', 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'black';
                  }}
                >
                  {saving ? 'Saving...' : 'Save & Share'}
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
                 <div style={{ width: 240, fontFamily: 'var(--font-typewriter)', textAlign: 'center' }}>
                   <div className="font-typewriter" style={{ fontSize: '0.65rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink-brown)', marginBottom: 12, fontWeight: 'bold', textAlign: 'center' }}>
                     Voice Preview
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
                     <img
                       src="/recorder.png"
                       alt="Recorder"
                       style={{
                         height: '80px',
                         objectFit: 'contain',
                         display: 'block'
                       }}
                     />
                   </div>
                   <div style={{ marginTop: 10 }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                       <button
                         type="button"
                         onClick={() => {
                           if (!audioRef.current) return;
                           if (isPlayingVoice) {
                             audioRef.current.pause();
                             setIsPlayingVoice(false);
                           } else {
                             audioRef.current.play().catch(e => console.error(e));
                             setIsPlayingVoice(true);
                           }
                         }}
                         style={{
                           flex: 1,
                           border: '1px solid black',
                           background: 'transparent',
                           padding: '6px 12px',
                           fontFamily: 'var(--font-typewriter)',
                           fontSize: '0.7rem',
                           cursor: 'pointer',
                           letterSpacing: '1px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '4px'
                         }}
                       >
                         {isPlayingVoice ? '❚❚ Pause' : '▶ Play'}
                       </button>
                       <button
                         type="button"
                         onClick={() => {
                           if (!audioRef.current) return;
                           audioRef.current.pause();
                           audioRef.current.currentTime = 0;
                           setIsPlayingVoice(false);
                         }}
                         style={{
                           flex: 1,
                           border: '1px solid black',
                           background: 'transparent',
                           padding: '6px 12px',
                           fontFamily: 'var(--font-typewriter)',
                           fontSize: '0.7rem',
                           cursor: 'pointer',
                           letterSpacing: '1px'
                         }}
                       >
                         ■ Stop
                       </button>
                     </div>
                     <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginTop: 6 }}>
                       {isPlayingVoice ? 'Playback active' : 'Playback idle'}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </div>

          {/* ── FEEDBACK MODAL ── */}
          {showFeedback && (
            <FeedbackModal
              step={feedbackStep}
              data={feedbackData}
              submitting={feedbackSubmitting}
              submitted={feedbackSubmitted}
              onChange={(key, val) => setFeedbackData(prev => ({ ...prev, [key]: val }))}
              onNext={() => setFeedbackStep(s => Math.min(s + 1, 5))}
              onBack={() => setFeedbackStep(s => Math.max(s - 1, 1))}
              onSubmit={submitFeedback}
              onDismiss={() => setShowFeedback(false)}
            />
          )}
       </div>
     );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes shaky {
          0% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-1.5px, -1.5px) rotate(-1deg); }
          20% { transform: translate(-2.5px, 0px) rotate(1.5deg); }
          30% { transform: translate(1.5px, 1.5px) rotate(0deg); }
          40% { transform: translate(1.5px, -1.5px) rotate(1deg); }
          50% { transform: translate(-1.5px, 2.5px) rotate(-1.5deg); }
          60% { transform: translate(-2.5px, 1.5px) rotate(0deg); }
          70% { transform: translate(2.5px, 1.5px) rotate(-1deg); }
          80% { transform: translate(-1.5px, -1.5px) rotate(1.5deg); }
          90% { transform: translate(1.5px, 2.5px) rotate(0deg); }
          100% { transform: translate(1.5px, -2.5px) rotate(-1deg); }
        }
        .shaky-recorder {
          animation: shaky 0.12s infinite;
        }
      `}</style>

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
        <div className="builder-canvas-area" style={{ flexDirection: 'column', position: 'relative' }}>

          {/* Username and Depart button directly on the background, to the left of the right tab */}
          <div style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 10
          }}>
            {userRecord?.role === 'admin' && (
              <button onClick={() => router.push('/admin/pending-users')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '8px 18px', fontWeight: 'bold', background: 'var(--parchment-dark)', color: 'var(--ink-brown)', borderColor: 'var(--sepia)' }}>
                Admin Queue
              </button>
            )}
            <span className="font-typewriter" style={{ fontSize: '0.8rem', color: 'var(--sepia)', letterSpacing: '1.5px', fontWeight: 'bold' }}>
              {user?.displayName || user?.email}
            </span>
            <button onClick={handleSignOut} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '8px 18px', fontWeight: 'bold' }}>
              Depart
            </button>
          </div>

          <div ref={canvasRef} className="bouquet-canvas" onClick={() => setActiveFlower(null)}>


            {arranged.length === 0 && (
              <div className="canvas-placeholder">
                <img src="/flowers/Floravo - 3 - Edited.png" alt="Floravo" style={{ height: 108, objectFit: 'contain', marginBottom: 12 }} />
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
          <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--parchment-deep)' }}>
            <div className="font-typewriter" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--sepia-light)', marginBottom: 12 }}>Greenery Background</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="greenery-scroll-container">
              {['greenery1.png','greenery2.png','greenery3.png','greenery4.png','greenery5.png'].map((file, idx) => {
                const isSelected = selectedGreenery === file;
                return (
                  <button
                    key={file}
                    id={`btn-greenery-${idx + 1}`}
                    onClick={() => changeGreenery(file)}
                    title={`Greenery ${idx + 1}`}
                    style={{
                      flex: '0 0 auto',
                      width: '72px',
                      height: '72px',
                      padding: 4,
                      border: isSelected ? '2px solid var(--sepia)' : '1px solid var(--parchment-deep)',
                      background: isSelected ? 'var(--parchment-dark)' : 'rgba(255,255,255,0.4)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isSelected ? 1 : 0.75,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.borderColor = 'var(--sepia-light)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.opacity = '0.75';
                        e.currentTarget.style.borderColor = 'var(--parchment-deep)';
                      }
                    }}
                  >
                    <img src={`/flowers/${file}`} alt={`Greenery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  </button>
                );
              })}
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
/* ═══════════════════════════════════════════════
   FEEDBACK MODAL COMPONENT
   ═══════════════════════════════════════════════ */
function FeedbackModal({ step, data, submitting, onChange, onNext, onBack, onSubmit, onDismiss }) {
  const totalSteps = 5;

  const canGoNext = () => {
    if (step === 1) return !!data.shared;
    if (step === 2) return data.meaningfulness > 0;
    if (step === 5) return !!data.wouldUseAgain;
    return true;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(30, 15, 5, 0.55)', backdropFilter: 'blur(3px)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 560, background: '#fdf6e3',
        borderTop: '3px solid #3b200a', borderLeft: '1px solid #d4b97a',
        borderRight: '1px solid #d4b97a', padding: '36px 40px 40px',
        position: 'relative', fontFamily: 'var(--font-typewriter)',
        animation: 'slideUpModal 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <style>{`
          @keyframes slideUpModal {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Dismiss */}
        <button onClick={onDismiss} style={{
          position: 'absolute', top: 16, right: 20, background: 'none',
          border: 'none', cursor: 'pointer', fontFamily: 'var(--font-typewriter)',
          fontSize: '0.7rem', color: 'var(--sepia-light)', letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>Skip ✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--sepia-light)', marginBottom: 4 }}>
            Floravo Atelier · Post-Share Survey
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--ink-brown)', lineHeight: 1.2 }}>
            A Moment of Your Time
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--sepia)', marginTop: 4, fontStyle: 'italic' }}>
            Help us craft a finer experience — {totalSteps - step + 1} question{totalSteps - step + 1 !== 1 ? 's' : ''} remaining.
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              width: i < step ? 20 : 8, height: 8, borderRadius: 4,
              background: i < step ? 'var(--ink-brown)' : 'var(--parchment-deep)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--ink-brown)', marginBottom: 16 }}>
              Have you shared this bouquet with someone yet?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { val: 'yes',     label: '✅  Yes, I shared it!' },
                { val: 'not_yet', label: '⏳  Not yet, but I plan to' },
                { val: 'no_plan', label: "✕   I don't plan to share it" },
              ].map(opt => (
                <button key={opt.val} onClick={() => onChange('shared', opt.val)} style={{
                  textAlign: 'left', padding: '12px 16px',
                  border: data.shared === opt.val ? '2px solid var(--ink-brown)' : '1px solid var(--parchment-deep)',
                  background: data.shared === opt.val ? '#f2e4c0' : 'white',
                  cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.75rem',
                  color: 'var(--ink-brown)', transition: 'all 0.15s ease',
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--ink-brown)', marginBottom: 6 }}>
              How meaningful does this bouquet feel compared to a normal message?
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginBottom: 20, fontStyle: 'italic' }}>
              1 = Just another message &nbsp;·&nbsp; 5 = Much more meaningful
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => onChange('meaningfulness', n)} style={{
                  width: 52, height: 52,
                  border: data.meaningfulness === n ? '2px solid var(--ink-brown)' : '1px solid var(--parchment-deep)',
                  background: data.meaningfulness === n ? 'var(--ink-brown)' : 'white',
                  color: data.meaningfulness === n ? 'var(--parchment-light)' : 'var(--ink-brown)',
                  cursor: 'pointer', fontFamily: 'var(--font-typewriter)',
                  fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 2,
                  transition: 'all 0.15s ease',
                }}>{n}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.6rem', color: 'var(--sepia-light)', fontStyle: 'italic' }}>
              <span>Just another message</span><span>Much more meaningful</span>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--ink-brown)', marginBottom: 6 }}>
              Did anything feel confusing, difficult, or frustrating?
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginBottom: 14, fontStyle: 'italic' }}>
              Tell us honestly. We read every response.
            </div>
            <textarea
              value={data.frustrations}
              onChange={e => onChange('frustrations', e.target.value)}
              placeholder="e.g. The flower panel was hard to scroll on mobile..."
              maxLength={500} rows={4}
              style={{
                width: '100%', padding: '12px 14px', fontFamily: 'var(--font-typewriter)',
                fontSize: '0.78rem', color: 'var(--ink-brown)', background: '#fffdf8',
                border: '1px solid var(--parchment-deep)', borderBottom: '2px solid var(--sepia)',
                outline: 'none', resize: 'none', lineHeight: 1.6,
              }}
            />
            <div style={{ fontSize: '0.6rem', color: 'var(--sepia-light)', textAlign: 'right', marginTop: 4 }}>
              {data.frustrations.length}/500
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--ink-brown)', marginBottom: 6 }}>
              What's one feature you wish Floravo had?
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--sepia-light)', marginBottom: 14, fontStyle: 'italic' }}>
              e.g. Video messages, more flowers, music, gift themes, animation...
            </div>
            <input
              type="text"
              value={data.wishFeature}
              onChange={e => onChange('wishFeature', e.target.value)}
              placeholder="Describe your dream feature..."
              maxLength={200}
              style={{
                width: '100%', padding: '13px 14px', fontFamily: 'var(--font-typewriter)',
                fontSize: '0.78rem', color: 'var(--ink-brown)', background: '#fffdf8',
                border: 'none', borderBottom: '2px solid var(--sepia)', outline: 'none',
              }}
            />
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--ink-brown)', marginBottom: 16 }}>
              Would you use Floravo again?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { val: 'definitely', label: '🌸  Definitely — already planning my next one' },
                { val: 'probably',   label: '🌿  Probably — I enjoyed it' },
                { val: 'maybe',      label: '🌱  Maybe — depends on the occasion' },
                { val: 'unlikely',   label: '🍂  Unlikely — not quite for me' },
                { val: 'never',      label: "✕   No — I don't see myself returning" },
              ].map(opt => (
                <button key={opt.val} onClick={() => onChange('wouldUseAgain', opt.val)} style={{
                  textAlign: 'left', padding: '11px 16px',
                  border: data.wouldUseAgain === opt.val ? '2px solid var(--ink-brown)' : '1px solid var(--parchment-deep)',
                  background: data.wouldUseAgain === opt.val ? '#f2e4c0' : 'white',
                  cursor: 'pointer', fontFamily: 'var(--font-typewriter)', fontSize: '0.72rem',
                  color: 'var(--ink-brown)', transition: 'all 0.15s ease',
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {step > 1 && (
            <button onClick={onBack} style={{
              flex: '0 0 auto', padding: '10px 20px',
              border: '1px solid var(--parchment-deep)', background: 'white',
              cursor: 'pointer', fontFamily: 'var(--font-typewriter)',
              fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase',
              color: 'var(--sepia)',
            }}>← Back</button>
          )}
          {step < totalSteps ? (
            <button onClick={onNext} disabled={!canGoNext()} style={{
              flex: 1, padding: '12px',
              border: '1px solid var(--ink-brown)',
              background: canGoNext() ? 'var(--ink-brown)' : 'var(--parchment-dark)',
              color: canGoNext() ? 'var(--parchment-light)' : 'var(--sepia-light)',
              cursor: canGoNext() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem',
              letterSpacing: '2px', textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}>Continue →</button>
          ) : (
            <button onClick={onSubmit} disabled={!canGoNext() || submitting} style={{
              flex: 1, padding: '12px',
              border: '1px solid var(--ink-brown)',
              background: canGoNext() ? 'var(--ink-brown)' : 'var(--parchment-dark)',
              color: 'var(--parchment-light)',
              cursor: canGoNext() ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-typewriter)', fontSize: '0.7rem',
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>{submitting ? 'Sending…' : '✉ Send Feedback'}</button>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: 16, right: 24, opacity: 0.1, fontSize: '2rem', pointerEvents: 'none' }}>🌸</div>
      </div>
    </div>
  );
}
