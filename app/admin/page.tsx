'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const BB: React.CSSProperties = { fontFamily: 'var(--font-bebas)' }

interface UserRow { email: string; diasDesdeRegistro: number }

interface KpiData {
  totalUsers: number
  activeUsers: number
  newThisWeek: number
  usuarios: UserRow[]
}

export default function AdminPage() {
  const [data, setData] = useState<KpiData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/kpis')
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.replace('/'); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .catch(() => setError('Error cargando datos'))
  }, [router])

  if (error) return (
    <Shell><p style={{ color: '#ff5555', fontSize: '0.9rem' }}>{error}</p></Shell>
  )

  if (!data) return (
    <Shell><p style={{ color: '#666', fontSize: '0.9rem', letterSpacing: 1 }}>Cargando...</p></Shell>
  )

  const pct = data.totalUsers > 0 ? Math.round((data.activeUsers / data.totalUsers) * 100) : 0

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ ...BB, fontSize: '3rem', color: '#c8f135', letterSpacing: 4, lineHeight: 1 }}>GYM LOG</div>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', fontSize: '0.7rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', cursor: 'pointer' }}
        >
          Volver
        </button>
      </div>

      <div style={{ ...BB, fontSize: '1.2rem', color: '#666', letterSpacing: 3, marginBottom: 24 }}>PANEL DE ADMINISTRACIÓN</div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'nowrap' }}>

        {/* Card — Usuarios registrados */}
        <div style={{ flex: '1 1 0', minWidth: 0, background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#666', lineHeight: 1.3 }}>
              Usuarios<br />registrados
            </div>
            <div style={{ background: 'rgba(200,241,53,0.15)', borderRadius: 6, padding: 6, lineHeight: 0, flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ ...BB, fontSize: '3rem', color: '#f0f0f0', lineHeight: 1, marginBottom: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#c8f135' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#f0f0f0' }}
          >
            {data.totalUsers}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c8f135', fontSize: '0.72rem' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
            <span>+{data.newThisWeek} esta semana</span>
          </div>
        </div>

        {/* Card — Usuarios activos */}
        <div style={{ flex: '1 1 0', minWidth: 0, background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#666', lineHeight: 1.3 }}>
              Usuarios<br />activos
            </div>
            <div style={{ background: 'rgba(200,241,53,0.15)', borderRadius: 6, padding: 6, lineHeight: 0, flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
            <div style={{ ...BB, fontSize: '3rem', color: '#f0f0f0', lineHeight: 1 }}>{data.activeUsers}</div>
            <div style={{ color: '#666', fontSize: '0.85rem' }}>/ {data.totalUsers}</div>
          </div>
          <div style={{ background: '#2e2e2e', borderRadius: 4, height: 5, marginBottom: 6, overflow: 'hidden' }}>
            <div style={{ background: '#c8f135', height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ color: '#c8f135', fontSize: '0.72rem' }}>{pct}% activos</div>
        </div>

      </div>

      {/* Modal usuarios */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #2e2e2e' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666' }}>
                Usuarios registrados
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', lineHeight: 0, padding: 4 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* Tabla */}
            <div style={{ overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2e2e2e' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#444', fontWeight: 400 }}>Email</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#444', fontWeight: 400 }}>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {data.usuarios.map((u, i) => (
                    <tr key={u.email} style={{ borderTop: i > 0 ? '1px solid #242424' : 'none' }}>
                      <td style={{ padding: '11px 20px', color: '#f0f0f0', fontSize: '0.82rem' }}>{u.email}</td>
                      <td style={{ padding: '11px 20px', color: '#666', fontSize: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {u.diasDesdeRegistro === 0 ? 'Hoy' : u.diasDesdeRegistro === 1 ? 'Hace 1 día' : `Hace ${u.diasDesdeRegistro} días`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {children}
      </div>
    </div>
  )
}
