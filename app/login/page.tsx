'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const BB: React.CSSProperties = { fontFamily: 'var(--font-bebas)' }

const INPUT: React.CSSProperties = {
  width: '100%',
  background: '#0e0e0e',
  border: '1px solid #2e2e2e',
  borderRadius: 10,
  color: '#f0f0f0',
  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
  fontSize: '1.6rem',
  padding: '18px 20px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

function focusAccent(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#c8f135'
}
function blurAccent(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#2e2e2e'
}

// ─── Página ───────────────────────────────────────────────────────────────────

function SearchParamsReader({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('error') === 'confirmation_failed') {
      onError('El enlace de confirmación no es válido o ha expirado.')
    }
  }, [searchParams, onError])
  return null
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  const router = useRouter()

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('Email not confirmed')) return 'Debes confirmar tu email antes de iniciar sesión.'
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con este email.'
    if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
    if (msg.includes('Unable to validate email')) return 'El formato del email no es válido.'
    return msg
  }

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(translateError(error.message))
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRegister() {
    if (!email || !password) { setError('Completa todos los campos.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(translateError(error.message))
    } else {
      setRegistered(true)
    }
    setLoading(false)
  }

  // ── Pantalla de confirmación pendiente ──────────────────────────────────────
  if (registered) {
    return (
      <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
        <Header />
        <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 32, width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ ...BB, fontSize: '2.2rem', color: '#c8f135', letterSpacing: 2, marginBottom: 16 }}>
            Revisa tu email
          </div>
          <p style={{ color: '#f0f0f0', fontSize: '1rem', lineHeight: 1.7, marginBottom: 12 }}>
            Te hemos enviado un correo de confirmación a:
          </p>
          <p style={{ color: '#c8f135', fontSize: '1.1rem', fontWeight: 500, marginBottom: 20, wordBreak: 'break-all' }}>
            {email}
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Haz clic en el enlace del email para activar tu cuenta. Una vez confirmado podrás iniciar sesión.
          </p>
          <hr style={{ border: 'none', borderTop: '1px solid #2e2e2e', margin: '24px 0' }} />
          <button
            onClick={() => { setRegistered(false); setMode('login') }}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666')}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario principal ────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      <Suspense fallback={null}>
        <SearchParamsReader onError={msg => setError(msg)} />
      </Suspense>
      <Header />

      {/* Card */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 32, width: '100%', maxWidth: 440 }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          <TabBtn active={mode === 'login'} onClick={() => { setMode('login'); setError(null) }}>Entrar</TabBtn>
          <TabBtn active={mode === 'register'} onClick={() => { setMode('register'); setError(null) }}>Crear cuenta</TabBtn>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            style={INPUT}
            onFocus={focusAccent}
            onBlur={blurAccent}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
          />
        </div>

        {/* Contraseña */}
        <div style={{ marginBottom: mode === 'register' ? 12 : 24 }}>
          <div style={{ fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>Contraseña</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={INPUT}
            onFocus={focusAccent}
            onBlur={blurAccent}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
          />
        </div>

        {/* Nota registro */}
        {mode === 'register' && (
          <p style={{ color: '#666', fontSize: '0.8rem', letterSpacing: 1, lineHeight: 1.6, marginBottom: 24 }}>
            Recibirás un email para confirmar tu cuenta antes de poder acceder.
          </p>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: '#ff5555', fontSize: '0.85rem', marginBottom: 16, letterSpacing: 0.5 }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <SubmitBtn
          label={mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          loading={loading}
          onClick={mode === 'login' ? handleLogin : handleRegister}
        />
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Header() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ ...BB, fontSize: '4rem', color: '#c8f135', letterSpacing: 4, lineHeight: 1 }}>
        GYM LOG
      </div>
      <div style={{ color: '#666', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>
        registro de entrenamientos
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 0',
        background: active ? '#c8f135' : 'none',
        border: `1px solid ${active ? '#c8f135' : '#2e2e2e'}`,
        borderRadius: 8,
        color: active ? '#0e0e0e' : '#666',
        ...BB, fontSize: '1rem', letterSpacing: 2,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

function SubmitBtn({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', background: hov && !loading ? '#aed62e' : '#c8f135',
        border: 'none', borderRadius: 10, color: '#0e0e0e',
        ...BB, fontSize: '1.3rem', letterSpacing: 3, padding: 14,
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s, background 0.15s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {loading ? '...' : label.toUpperCase()}
    </button>
  )
}
