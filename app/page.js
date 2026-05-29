'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, logIn } from '../lib/auth';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/builder');
      else setCheckingAuth(false);
    });
    return () => unsub();
  }, [router]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!formData.name.trim()) throw new Error('Please enter your name.');
        if (formData.password !== formData.confirm) throw new Error('Passwords do not match.');
        if (formData.password.length < 6) throw new Error('Password must be at least 6 characters.');
        await signUp(formData.email, formData.password, formData.name.trim());
      } else {
        await logIn(formData.email, formData.password);
      }
      router.push('/builder');
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'This address is already registered.',
        'auth/user-not-found': 'No account found with this address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
      };
      setError(messages[err.code] || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError('');
    setFormData({ name: '', email: '', password: '', confirm: '' });
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="font-typewriter text-sepia" style={{ fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', opacity: 0.6 }}>
          Preparing correspondence…
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-root" style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>

      {/* ── DECORATIVE BACKGROUND ELEMENTS ── */}
      <div className="login-bg-deco" aria-hidden="true">
        {/* Corner ornaments */}
        <div style={cornerStyle('top', 'left')}>
          <CornerOrnament />
        </div>
        <div style={{ ...cornerStyle('top', 'right'), transform: 'rotate(90deg)' }}>
          <CornerOrnament />
        </div>
        <div style={{ ...cornerStyle('bottom', 'left'), transform: 'rotate(270deg)' }}>
          <CornerOrnament />
        </div>
        <div style={{ ...cornerStyle('bottom', 'right'), transform: 'rotate(180deg)' }}>
          <CornerOrnament />
        </div>

        {/* Faded background flowers */}
        <div style={{ position: 'fixed', bottom: '-20px', left: '-30px', fontSize: '12rem', opacity: 0.04, pointerEvents: 'none', userSelect: 'none', filter: 'sepia(1)' }}>
          🌸
        </div>
        <div style={{ position: 'fixed', top: '10%', right: '-20px', fontSize: '10rem', opacity: 0.05, pointerEvents: 'none', userSelect: 'none', filter: 'sepia(1)', transform: 'rotate(30deg)' }}>
          🌻
        </div>
        <div style={{ position: 'fixed', top: '50%', left: '5%', fontSize: '8rem', opacity: 0.04, pointerEvents: 'none', userSelect: 'none', filter: 'sepia(1)', transform: 'rotate(-15deg)' }}>
          🌹
        </div>
      </div>

      {/* ── LEFT PANEL — BRANDING ── */}
      <div className="login-brand-panel" style={{
        flex: '1 1 42%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        borderRight: '1px solid var(--parchment-deep)',
        position: 'relative',
        gap: '32px',
      }}>

        {/* Postmark (decorative, top right of left panel) */}
        <div className="postmark" style={{ top: '40px', right: '40px' }}>
          <span>Pollachi</span>
          <span>May 2026</span>
          <span>Tamil Nadu</span>
        </div>

        {/* Main Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', animation: 'fadeInUp 0.8s ease', marginTop: '-40px' }}>
          <img src="/flowers/floravo.png" alt="Floravo Logo" style={{ width: '100%', maxWidth: 360, objectFit: 'contain' }} />
        </div>

        {/* Decorative divider */}
        <div className="ornament-divider" style={{ width: '100%', maxWidth: 360 }}>
          <span style={{ fontSize: '1rem' }}>✦</span>
        </div>

        {/* Tagline */}
        <div style={{ textAlign: 'center', maxWidth: 340, animation: 'fadeInUp 0.9s ease 0.1s both' }}>
          <p className="font-script" style={{ fontSize: '1.25rem', color: 'var(--sepia)', fontStyle: 'italic', lineHeight: 1.7, marginBottom: 16 }}>
            "Craft arrangements of singular beauty, as if composed by Nature's own hand."
          </p>
          <p className="font-typewriter" style={{ fontSize: '0.65rem', color: 'var(--sepia-light)', textTransform: 'uppercase', letterSpacing: '3px' }}>
            — Est. Pollachi, MMXXIV —
          </p>
        </div>

        {/* Postal stamp */}
        <div style={{ animation: 'fadeIn 1.2s ease 0.3s both' }}>
          <div className="stamp">
            <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>🌿</div>
            <div>Floral Post</div>
            <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>By Royal Appointment</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — FORM ── */}
      <div className="login-form-panel" style={{
        flex: '1 1 58%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
      }}>

        {/* Letter / card */}
        <div className="letter-card animate-fadeInUp" style={{
          width: '100%',
          maxWidth: 480,
          padding: '48px 48px 40px',
          position: 'relative',
        }}>
          <div className="letter-card-inner" style={{ padding: '36px 36px 28px' }}>

            {/* Letter header */}
            <div style={{ marginBottom: 28 }}>
              <div className="font-typewriter" style={{ fontSize: '0.6rem', color: 'var(--sepia-light)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 8 }}>
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — Pollachi, Tamil Nadu
              </div>
              <h2 className="font-display" style={{ fontSize: '1.8rem', color: 'var(--ink-brown)', fontWeight: 600, lineHeight: 1.2 }}>
                {mode === 'login' ? 'Welcome Back,' : 'A New Correspondence,'}
              </h2>
              <p className="font-script" style={{ fontSize: '1rem', color: 'var(--sepia)', fontStyle: 'italic', marginTop: 4 }}>
                {mode === 'login'
                  ? 'We are pleased to receive you once more.'
                  : 'Pray, introduce yourself to our Atelier.'}
              </p>
            </div>

            {/* Ornament divider */}
            <div className="ornament-divider" style={{ marginBottom: 24 }}>
              <span style={{ fontSize: '0.9rem' }}>❧</span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {mode === 'register' && (
                <div className="input-wrapper" style={{ animationDelay: '0.05s' }}>
                  <label className="input-label" htmlFor="name">Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="vintage-input"
                    placeholder="e.g. Elizabeth Hartwell"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="input-wrapper">
                <label className="input-label" htmlFor="email">Correspondence Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="vintage-input"
                  placeholder="e.g. hartwell@post.co.uk"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="input-wrapper">
                <label className="input-label" htmlFor="password">Secret Cipher</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="vintage-input"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {mode === 'register' && (
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="confirm">Confirm Cipher</label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    className="vintage-input"
                    placeholder="Repeat your cipher"
                    value={formData.confirm}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <div className="error-msg" role="alert">
                  ⚠ {error}
                </div>
              )}

              <div style={{ marginTop: 28 }}>
                <button
                  id={mode === 'login' ? 'btn-login' : 'btn-register'}
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? 'Dispatching…'
                    : mode === 'login'
                    ? '✉ Enter the Atelier'
                    : '📜 Register & Enter'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="ornament-divider" style={{ marginTop: 24, marginBottom: 16 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--sepia-light)' }}>or</span>
            </div>

            {/* Switch mode */}
            <div style={{ textAlign: 'center' }}>
              <span className="font-typewriter" style={{ fontSize: '0.7rem', color: 'var(--sepia-light)', letterSpacing: '0.5px' }}>
                {mode === 'login' ? 'First visit to our Atelier? ' : 'Already a member of our society? '}
              </span>
              <button
                id={mode === 'login' ? 'btn-switch-to-register' : 'btn-switch-to-login'}
                type="button"
                className="btn-ghost"
                onClick={switchMode}
              >
                {mode === 'login' ? 'Register here' : 'Sign in here'}
              </button>
            </div>

            {/* Closing salutation */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--parchment-deep)' }}>
              <p className="font-script" style={{ fontSize: '0.8rem', color: 'var(--sepia-light)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 0 }}>
                Yours faithfully,
              </p>
              <img src="/flowers/floravo.png" alt="Floravo Logo" style={{ width: '240px', objectFit: 'contain', marginTop: '-16px' }} />
            </div>

          </div>
        </div>

        {/* Decorative stamp bottom right */}
        <div style={{ position: 'absolute', bottom: 32, right: 48, opacity: 0.15 }}>
          <div className="stamp" style={{ transform: 'rotate(10deg)', fontSize: '0.55rem' }}>
            <div style={{ fontSize: '1rem' }}>🏰</div>
            <div>By Appointment</div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Helpers ── */
function cornerStyle(vert, horiz) {
  return {
    position: 'fixed',
    [vert]: 24,
    [horiz]: 24,
    width: 60,
    height: 60,
    opacity: 0.15,
    zIndex: 0,
    pointerEvents: 'none',
  };
}

function CornerOrnament() {
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2 L2 30 M2 2 L30 2" stroke="#7a4f2a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M2 2 L12 12" stroke="#7a4f2a" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="2" cy="2" r="2" fill="#b8860b"/>
      <circle cx="16" cy="2" r="1" fill="#b8860b"/>
      <circle cx="2" cy="16" r="1" fill="#b8860b"/>
    </svg>
  );
}
