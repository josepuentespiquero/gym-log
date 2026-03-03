'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

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

function ResetForm() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Intercambiar el code por sesión al montar
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('El enlace no es válido o ha expirado.')
      setExchanging(false)
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError('El enlace no es válido o ha expirado.')
      }
      setExchanging(false)
    })
  }, [searchParams])

  async function handleSubmit() {
    if (!password) { setError('Introduce una contraseña.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/'), 2500)
    }
  }

  if (exchanging) {
    return (
      <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center', letterSpacing: 1 }}>
        Verificando enlace...
      </p>
    )
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...BB, fontSize: '2rem', color: '#c8f135', letterSpacing: 2, marginBottom: 12 }}>
          Contraseña actualizada
        </div>
        <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Redirigiendo al inicio...
        </p>
      </div>
    )
  }

  if (error && !password) {
    // Error en el exchange (enlace inválido)
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#ff5555', fontSize: '0.9rem', marginBottom: 20 }}>{error}</p>
        <button
          onClick={() => router.push('/login')}
          style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f0f0f0')}
          onMouseLeave={e => (e.currentTarget.style.color = '#666')}
        >
          Volver al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{ ...BB, fontSize: '1.6rem', color: '#f0f0f0', letterSpacing: 2, marginBottom: 6 }}>
        Nueva contraseña
      </div>
      <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 24, margin: '0 0 24px' }}>
        Elige una contraseña nueva para tu cuenta.
      </p>

      {/* Contraseña nueva */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>
          Contraseña nueva
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="new-password"
            style={{ ...INPUT, paddingRight: 52 }}
            onFocus={focusAccent}
            onBlur={blurAccent}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0, color: showPass ? '#c8f135' : '#555', transition: 'color 0.15s' }}
            tabIndex={-1}
          >
            {showPass ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Confirmar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>
          Confirmar contraseña
        </div>
        <input
          type={showPass ? 'text' : 'password'}
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          placeholder="••••••"
          autoComplete="new-password"
          style={INPUT}
          onFocus={focusAccent}
          onBlur={blurAccent}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {error && (
        <p style={{ color: '#ff5555', fontSize: '0.85rem', marginBottom: 16, letterSpacing: 0.5 }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: '100%', background: '#c8f135', border: 'none', borderRadius: 10,
          color: '#0e0e0e', ...BB, fontSize: '1.3rem', letterSpacing: 3, padding: 14,
          cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.4 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {loading ? '...' : 'GUARDAR CONTRASEÑA'}
      </button>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ ...BB, fontSize: '4rem', color: '#c8f135', letterSpacing: 4, lineHeight: 1 }}>
          GYM LOG
        </div>
        <div style={{ color: '#666', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4 }}>
          registro de entrenamientos
        </div>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 32, width: '100%', maxWidth: 440 }}>
        <Suspense fallback={<p style={{ color: '#666', textAlign: 'center' }}>Cargando...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
