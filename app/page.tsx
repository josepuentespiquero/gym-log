'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useEntrenamientos } from '@/hooks/useEntrenamientos'
import { supabase, Entrenamiento, Ejercicio } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Constants ───────────────────────────────────────────────────────────────


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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fechaHoy(): string {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`
}

function isoToDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${d}/${m}/${String(y).slice(2)}`
}

// Converts ISO "YYYY-MM-DD" → "DD/MM/YYYY" for display in profile form
function isoToDisplayFull(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

// Parses "DD/MM/YYYY" → ISO "YYYY-MM-DD", returns null if invalid
function displayFullToISO(str: string): string | null {
  if (!str.trim()) return ''
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match.map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  if (y < 1900 || y > new Date().getFullYear()) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function diasDesde(iso: string): string {
  const [fy, fm, fd] = iso.split('-').map(Number)
  const now = new Date()
  const [hy, hm, hd] = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
  if (fy === hy && fm === hm && fd === hd) return 'Hoy'
  const diff = Math.round(
    (new Date(hy, hm - 1, hd).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000
  )
  return diff === 1 ? 'Hace 1 día' : `Hace ${diff} días`
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SeriePendiente {
  localId: string
  id_ejer: number
  descripcion: string
  peso: number | null
  repeticiones: number
  fallo: 'S' | 'N'
  reserva: number
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconTrash({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ff5555"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 12 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function focusAccent(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#c8f135'
}
function blurAccent(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#2e2e2e'
}

function FechaWrapper({ fecha, onFechaChange }: { fecha: string; onFechaChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="text"
        readOnly
        value={isoToDisplay(fecha)}
        style={{ ...INPUT, flex: 1 }}
        onFocus={focusAccent}
        onBlur={blurAccent}
      />
      <label
        style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0e0e', border: '1px solid #2e2e2e', borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8f135')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2e2e2e')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8f135" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <input
          type="date"
          value={fecha}
          onChange={e => onFechaChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </label>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: 'relative', width: 52, height: 28, flexShrink: 0, cursor: 'pointer', display: 'block' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
      />
      <span style={{
        position: 'absolute', inset: 0,
        background: checked ? '#c8f135' : '#0e0e0e',
        border: `1px solid ${checked ? '#c8f135' : '#2e2e2e'}`,
        borderRadius: 999,
        transition: '0.2s',
        display: 'block',
      }} />
      <span style={{
        position: 'absolute',
        width: 20, height: 20, left: 3, top: 3,
        background: checked ? '#0e0e0e' : '#666',
        borderRadius: '50%',
        transform: checked ? 'translateX(24px)' : 'translateX(0)',
        transition: '0.2s',
        display: 'block',
      }} />
    </label>
  )
}

function SerieItem({ s, numSerie, onDelete, showCamposExtra = true }: { s: SeriePendiente; numSerie: number; onDelete: () => void; showCamposExtra?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ background: '#0e0e0e', border: '1px solid #2e2e2e', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, animation: 'slideIn 0.2s ease' }}>
      <span style={{ ...BB, fontSize: '1.5rem', color: '#c8f135', minWidth: 36 }}>S{numSerie}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '1rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#f0f0f0', marginBottom: 4, fontWeight: 500 }}>
          {s.descripcion}
        </div>
        <div style={{ color: '#f0f0f0', fontSize: '1.25rem', fontWeight: 500 }}>
          {s.repeticiones} reps{s.peso != null ? ` · ${s.peso} kg` : ''}{showCamposExtra ? ` · Fallo: ${s.fallo}${s.fallo === 'N' ? ` · RIR: ${s.reserva}` : ''}` : ''}
        </div>
      </div>
      <button
        onClick={onDelete}
        style={{ background: hov ? 'rgba(255,85,85,0.15)' : 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'background 0.15s', lineHeight: 0, flexShrink: 0 }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <IconTrash />
      </button>
    </div>
  )
}

// ─── Nivel Icon ───────────────────────────────────────────────────────────────

function NivelIcon({ racha, niveles }: { racha: number; niveles: import('@/hooks/useEntrenamientos').Nivel[] }) {
  if (!niveles.length || racha === 0) return null

  const sorted = [...niveles].sort((a, b) => a.numero_rachas - b.numero_rachas)
  const currentLevel = [...sorted].reverse().find(n => n.numero_rachas <= racha)
  if (!currentLevel) return null

  const nextLevel = sorted.find(n => n.numero_rachas > racha)
  const fillPct = nextLevel
    ? Math.min((racha - currentLevel.numero_rachas) / (nextLevel.numero_rachas - currentLevel.numero_rachas) * 100, 100)
    : 100

  const iconUrl = `/martial-arts/${encodeURIComponent(currentLevel.icono)}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
        {/* Gris de fondo (icono completo desaturado) */}
        <img src={iconUrl} alt={currentLevel.nombre_nivel} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'grayscale(1) brightness(0.4)', objectFit: 'contain' }} />
        {/* Colores originales, relleno de abajo a arriba */}
        <img src={iconUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', clipPath: `inset(${100 - fillPct}% 0 0 0)` }} />
      </div>
      <span style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '0.95rem', color: '#aaa', lineHeight: 1.3 }}>{currentLevel.nombre_nivel}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const { entrenamientos, ejercicios, loading, guardarSeries, borrarEntrenamiento, getUltimaSesion, contarSeriesExistentes, racha, sesionesEstaSemana, metaSemanal, fechaInicioMeta, serieCamposExtra, niveles, semanasAnio, refetch, idUser } = useEntrenamientos()
  const router = useRouter()

  // Auth
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    if (!idUser) return
    supabase.from('usuarios').select('rol').eq('id_user', idUser).single()
      .then(({ data }) => { if (data?.rol === 'admin') setIsAdmin(true) })
  }, [idUser])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Perfil
  const [showPerfil, setShowPerfil] = useState(false)
  const [perfilForm, setPerfilForm] = useState({ fecha_nacimiento: '', peso: '', serie_campos_extra: false })
  const [cargandoPerfil, setCargandoPerfil] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [perfilFechaError, setPerfilFechaError] = useState('')

  async function abrirPerfil() {
    setShowPerfil(true)
    setCargandoPerfil(true)
    if (idUser) {
      const { data } = await supabase
        .from('usuarios')
        .select('fecha_nacimiento, peso, serie_campos_extra')
        .eq('id_user', idUser)
        .single()
      if (data) {
        setPerfilForm({
          fecha_nacimiento: isoToDisplayFull(data.fecha_nacimiento ?? ''),
          peso: data.peso != null ? String(data.peso) : '',
          serie_campos_extra: data.serie_campos_extra ?? false,
        })
      }
    }
    setCargandoPerfil(false)
  }

  async function guardarPerfil() {
    const isoFecha = displayFullToISO(perfilForm.fecha_nacimiento)
    if (isoFecha === null) {
      setPerfilFechaError('Formato inválido. Usa DD/MM/YYYY')
      return
    }
    setPerfilFechaError('')
    setGuardandoPerfil(true)
    if (idUser) {
      const { error } = await supabase.from('usuarios').update({
        fecha_nacimiento: isoFecha || null,
        peso: perfilForm.peso ? Number(perfilForm.peso) : null,
        serie_campos_extra: perfilForm.serie_campos_extra,
      }).eq('id_user', idUser)
      if (error) {
        setGuardandoPerfil(false)
        showToast(`Error: ${error.message}`)
        return
      }
      await refetch()
    }
    setGuardandoPerfil(false)
    setShowPerfil(false)
    showToast('Perfil guardado')
  }

  // Meta semanal
  const [showEditMeta, setShowEditMeta] = useState(false)
  const [showCalendario, setShowCalendario] = useState(false)
  const [editMetaVal, setEditMetaVal] = useState('3')
  const [guardandoMeta, setGuardandoMeta] = useState(false)

  async function guardarMetaSemanal() {
    setGuardandoMeta(true)
    if (idUser) {
      const hoy = new Date()
      const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
      const { error } = await supabase.from('usuarios').update({
        meta_semanal: Number(editMetaVal) || 3,
        fecha_inicio_meta_semanal: hoyISO,
      }).eq('id_user', idUser)
      if (error) {
        setGuardandoMeta(false)
        showToast(`Error: ${error.message}`)
        return
      }
      await refetch()
    }
    setGuardandoMeta(false)
    setShowEditMeta(false)
    showToast('Meta semanal actualizada')
  }

  // Form state — empty string on server to avoid timezone-based hydration mismatch
  const [fecha, setFecha] = useState('')
  useEffect(() => { setFecha(fechaHoy()) }, [])
  const [ejercicioSelectId, setEjercicioSelectId] = useState('')
  const [esCustom, setEsCustom] = useState(false)
  const [mostrarEstandares, setMostrarEstandares] = useState(false)

  const ejerciciosDisponibles = useMemo((): Ejercicio[] => {
    const idsPropios = new Set(entrenamientos.map(e => e.id_ejer))
    const filtered = ejercicios.filter(e =>
      mostrarEstandares ? (idsPropios.has(e.id_ejer) || e.estandar) : idsPropios.has(e.id_ejer)
    )
    // Deduplicar por id_ejer: preferir fila per-usuario sobre la global del catálogo
    const byId = new Map<number, Ejercicio>()
    for (const e of filtered) {
      if (!byId.has(e.id_ejer) || e.id_user != null) byId.set(e.id_ejer, e)
    }
    return [...byId.values()].sort((a, b) => a.descripcion.localeCompare(b.descripcion))
  }, [entrenamientos, ejercicios, mostrarEstandares])

  // Sync selected exercise when list changes
  useEffect(() => {
    if (ejerciciosDisponibles.length > 0 && !esCustom) {
      const currentId = parseInt(ejercicioSelectId)
      if (!ejerciciosDisponibles.find(e => e.id_ejer === currentId)) {
        setEjercicioSelectId(String(ejerciciosDisponibles[0].id_ejer))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ejerciciosDisponibles])
  const [ejercicioCustom, setEjercicioCustom] = useState('')
  const [peso, setPeso] = useState('')
  const [repeticiones, setRepeticiones] = useState('')
  const [fallo, setFallo] = useState<'S' | 'N'>('N')
  const [reserva, setReserva] = useState('')

  // Buffer
  const [buffer, setBuffer] = useState<SeriePendiente[]>([])

  // UI
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'resumen' | 'detalle'>('resumen')
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const id_ejerActual: number | null = esCustom ? null : (parseInt(ejercicioSelectId) || null)

  const ultimaSesion = useMemo(
    () => (id_ejerActual ? getUltimaSesion(id_ejerActual) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id_ejerActual, entrenamientos]
  )
  const serie1 = ultimaSesion.find(s => s.serie === 1) ?? ultimaSesion[0] ?? null

  function handleEjercicioChange(val: string) {
    if (val === '__otro__') {
      setEsCustom(true)
      setEjercicioCustom('')
    } else {
      setEsCustom(false)
      setEjercicioSelectId(val)
      const id = parseInt(val)
      const last = getUltimaSesion(id)
      const s1 = last.find(s => s.serie === 1) ?? last[0]
      if (s1) {
        setPeso(s1.peso != null ? String(s1.peso) : '')
        setRepeticiones(String(s1.repeticiones))
      }
    }
    setFallo('N')
    setReserva('')
  }

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  async function añadirSerie() {
    const reps = parseInt(repeticiones)
    if (!reps || reps < 1) { showToast('Introduce las repeticiones'); return }

    let id_ejer: number
    let descripcion: string

    if (esCustom) {
      const nombre = ejercicioCustom.trim()
      if (!nombre) { showToast('Introduce el nombre del ejercicio'); return }
      const { data: ejData, error } = await supabase
        .from('ejercicios_usuario')
        .upsert({ descripcion: nombre, id_user: idUser }, { onConflict: 'descripcion,id_user' })
        .select('id_ejer, descripcion')
        .single()
      if (error || !ejData) { showToast('Error al crear ejercicio'); return }
      id_ejer = ejData.id_ejer
      descripcion = ejData.descripcion
    } else {
      if (!id_ejerActual) { showToast('Selecciona un ejercicio'); return }
      id_ejer = id_ejerActual
      descripcion = ejercicios.find(e => e.id_ejer === id_ejer)?.descripcion ?? ''
    }

    setBuffer(prev => [...prev, {
      localId: crypto.randomUUID(),
      id_ejer,
      descripcion,
      peso: peso !== '' ? parseFloat(peso) : null,
      repeticiones: reps,
      fallo: serieCamposExtra ? fallo : 'N',
      reserva: serieCamposExtra ? (fallo === 'N' && reserva !== '' ? parseInt(reserva) : 0) : 0,
    }])
    setRepeticiones('')
    setFallo('N')
    setReserva('')
  }

  async function guardarTodo() {
    if (!buffer.length) { showToast('Añade al menos una serie'); return }
    setGuardando(true)
    const porEjercicio: Record<number, SeriePendiente[]> = {}
    for (const s of buffer) {
      if (!porEjercicio[s.id_ejer]) porEjercicio[s.id_ejer] = []
      porEjercicio[s.id_ejer].push(s)
    }
    const series = Object.entries(porEjercicio).flatMap(([idStr, items]) => {
      const id_ejer = parseInt(idStr)
      const existentes = contarSeriesExistentes(id_ejer, fecha)
      return items.map((s, i) => ({
        fecha, id_ejer, peso: s.peso,
        serie: existentes + i + 1,
        repeticiones: s.repeticiones, fallo: s.fallo,
        reserva: s.fallo === 'N' ? s.reserva : 0,
      }))
    })
    const { error } = await guardarSeries(series)
    if (error) showToast('Error al guardar')
    else { setBuffer([]); showToast('✓ Series guardadas') }
    setGuardando(false)
  }

  const porFecha = useMemo(() => {
    const g: Record<string, Set<string>> = {}
    for (const e of entrenamientos) {
      if (!g[e.fecha]) g[e.fecha] = new Set()
      const desc = ejercicios.find(ej => ej.id_ejer === e.id_ejer)?.descripcion ?? String(e.id_ejer)
      g[e.fecha].add(desc)
    }
    return Object.entries(g)
      .map(([f, ejs]) => ({ fecha: f, ejercicios: [...ejs].sort() }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [entrenamientos, ejercicios])

  const entrenamientosFiltrados = useMemo(() => {
    const getDesc = (id: number) => ejercicios.find(e => e.id_ejer === id)?.descripcion ?? ''
    const all = [...entrenamientos].sort((a, b) =>
      b.fecha.localeCompare(a.fecha) ||
      getDesc(a.id_ejer).localeCompare(getDesc(b.id_ejer), 'es') ||
      a.serie - b.serie
    )
    if (!busqueda) return all
    const q = busqueda.toLowerCase()
    return all.filter(e =>
      getDesc(e.id_ejer).toLowerCase().includes(q) ||
      e.fecha.includes(q) ||
      isoToDisplay(e.fecha).includes(q) ||
      isoToDisplayFull(e.fecha).includes(q)
    )
  }, [entrenamientos, ejercicios, busqueda])

  const totalReg = entrenamientos.length + buffer.length
  const lastDate = entrenamientos[0]?.fecha ?? null

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ ...BB, fontSize: '3.5rem', color: '#c8f135', letterSpacing: 4, lineHeight: 1 }}>GYM LOG</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Icono perfil */}
              <button
                onClick={abrirPerfil}
                title="Mi perfil"
                style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', padding: '4px 8px', cursor: 'pointer', lineHeight: 0, transition: 'color 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = '#f0f0f0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </button>
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  title="Panel de administración"
                  style={{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.3)', borderRadius: 6, color: '#c8f135', padding: '4px 8px', cursor: 'pointer', lineHeight: 0, transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,241,53,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,241,53,0.1)' }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleLogout}
              style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', fontSize: '0.7rem', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ff5555'; e.currentTarget.style.borderColor = '#ff5555' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {/* ── Habit Tracker ────────────────────────────────────────── */}
      {!loading && (
        <div style={{ width: '100%', maxWidth: 440, marginBottom: 16, display: 'flex', gap: 10 }}>

          {/* ESTA SEMANA */}
          <div style={{ flex: '1 1 0', minWidth: 0, background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#666' }}>Esta semana</div>
              <button
                onClick={() => { setEditMetaVal(String(metaSemanal)); setShowEditMeta(true) }}
                title="Editar objetivo semanal"
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, lineHeight: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
              <span style={{ ...BB, fontSize: '3rem', color: sesionesEstaSemana >= metaSemanal ? '#3B82F6' : '#f0f0f0', lineHeight: 1 }}>{sesionesEstaSemana}</span>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>/ {metaSemanal}</span>
            </div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              {Array.from({ length: metaSemanal }).map((_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < sesionesEstaSemana ? '#c8f135' : '#2e2e2e', flexShrink: 0 }} />
              ))}
            </div>
            <div style={{ background: '#2e2e2e', borderRadius: 4, height: 4, overflow: 'hidden' }}>
              <div style={{ background: '#c8f135', height: '100%', width: `${Math.min((sesionesEstaSemana / metaSemanal) * 100, 100)}%`, borderRadius: 4 }} />
            </div>
            {sesionesEstaSemana >= metaSemanal && (
              <div style={{ color: '#c8f135', fontSize: '0.7rem', marginTop: 6, letterSpacing: '0.5px' }}>Meta cumplida ✓</div>
            )}
          </div>

          {/* RACHA */}
          <div style={{ flex: '1 1 0', minWidth: 0, background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#666', marginBottom: 10 }}>Racha</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Fila 1: número + cuadritos */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ ...BB, fontSize: '3rem', color: racha > 0 ? '#f0f0f0' : '#444', lineHeight: 1 }}>{racha}</span>
                    <span style={{ color: '#666', fontSize: '0.7rem' }}>sem.</span>
                  </div>
                </div>
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setShowCalendario(true)}
                  title="Ver actividad por días"
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignContent: 'flex-start' }}>
                    {semanasAnio.map((estado, i) => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                        background:
                          estado === 'achieved' ? '#3B82F6' :
                          estado === 'partial'  ? '#1E3A5F' :
                          estado === 'future'   ? '#222' :
                          '#2e2e2e',
                      }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Fila 2: icono + nombre nivel */}
              {racha === 0
                ? <div style={{ color: '#555', fontSize: '0.6rem', letterSpacing: '0.5px', lineHeight: 1.4 }}>Empieza<br />esta semana</div>
                : <NivelIcon racha={racha} niveles={niveles} />
              }
            </div>
          </div>

        </div>
      )}

      {/* ── Card ──────────────────────────────────────────────────── */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 32, width: '100%', maxWidth: 440 }}>

        {/* FECHA */}
        <Field label="Fecha">
          <FechaWrapper fecha={fecha} onFechaChange={setFecha} />
        </Field>

        {/* EJERCICIO */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.95rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666' }}>Ejercicio</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mostrarEstandares}
                onChange={e => setMostrarEstandares(e.target.checked)}
                style={{ width: 13, height: 13, accentColor: '#c8f135', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.75rem', letterSpacing: '1px', color: mostrarEstandares ? '#c8f135' : '#555', transition: 'color 0.15s' }}>Mostrar estándares</span>
            </label>
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={esCustom ? '__otro__' : ejercicioSelectId}
              onChange={e => handleEjercicioChange(e.target.value)}
              style={INPUT}
              onFocus={focusAccent}
              onBlur={blurAccent}
            >
              {ejerciciosDisponibles.length === 0
                ? <option value="" disabled>Sin ejercicios — activa &quot;Mostrar estándares&quot;</option>
                : ejerciciosDisponibles.map(ej => <option key={ej.id_ejer} value={String(ej.id_ejer)}>{ej.descripcion}</option>)
              }
              <option value="__otro__">+ Nuevo ejercicio...</option>
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#c8f135', pointerEvents: 'none', fontSize: '1.1rem' }}>▾</span>
          </div>
          {esCustom && (
            <input
              type="text"
              value={ejercicioCustom}
              onChange={e => setEjercicioCustom(e.target.value)}
              placeholder="Nombre del ejercicio..."
              autoFocus
              style={{ ...INPUT, marginTop: 8 }}
              onFocus={focusAccent}
              onBlur={blurAccent}
            />
          )}
        </div>

        {/* ÚLTIMA VEZ */}
        {serie1 && (
          <div style={{ margin: '-8px 0 20px 0', background: '#0e0e0e', border: '1px solid #2e2e2e', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.95rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#666' }}>
                Última vez
              </span>
              <span style={{ ...BB, fontSize: '1.8rem', color: '#c8f135', letterSpacing: 1 }}>
                {diasDesde(serie1.fecha)} · {isoToDisplay(serie1.fecha)}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', color: '#f0f0f0', marginTop: 8, fontWeight: 500 }}>
              {serie1.peso != null ? `${serie1.peso} kg` : 'sin peso'} · {serie1.repeticiones} reps · Fallo: {serie1.fallo} · RIR: {serie1.reserva ?? 0}
            </div>
          </div>
        )}

        {/* PESO */}
        <Field label="Peso (kg)">
          <input
            type="number"
            value={peso}
            onChange={e => setPeso(e.target.value)}
            placeholder="— sin peso —"
            min="0"
            step="0.5"
            style={INPUT}
            onFocus={focusAccent}
            onBlur={blurAccent}
          />
        </Field>

        {/* REPETICIONES */}
        <Field label="Repeticiones">
          <input
            type="number"
            value={repeticiones}
            onChange={e => setRepeticiones(e.target.value)}
            placeholder="0"
            min="1"
            style={INPUT}
            onFocus={focusAccent}
            onBlur={blurAccent}
          />
        </Field>

        {/* FALLO MUSCULAR */}
        {serieCamposExtra && (
          <Field label="Fallo muscular">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ToggleSwitch checked={fallo === 'S'} onChange={v => setFallo(v ? 'S' : 'N')} />
              <span style={{ fontSize: '0.95rem', color: fallo === 'S' ? '#c8f135' : '#666', fontWeight: fallo === 'S' ? 500 : 400, transition: 'color 0.2s' }}>
                {fallo === 'S' ? 'Sí — fallo muscular' : 'No'}
              </span>
            </div>
          </Field>
        )}

        {/* RESERVA (RIR) — dimmed when fallo=S */}
        {serieCamposExtra && (
          <Field label="Reserva (RIR)">
            <div style={{ opacity: fallo === 'S' ? 0.3 : 1, pointerEvents: fallo === 'S' ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
              <input
                type="number"
                value={reserva}
                onChange={e => setReserva(e.target.value)}
                placeholder="0"
                min="0"
                max="10"
                style={INPUT}
                onFocus={focusAccent}
                onBlur={blurAccent}
              />
            </div>
          </Field>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #2e2e2e', margin: '24px 0' }} />

        {/* + AÑADIR SERIE */}
        <BtnAdd onClick={añadirSerie} />

        {/* SERIES header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ ...BB, fontSize: '1.4rem', letterSpacing: 2 }}>Series</span>
          {buffer.length > 0 && (
            <span style={{ color: '#666', fontSize: '0.8rem' }}>
              {buffer.length} serie{buffer.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* SERIES list */}
        {buffer.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {[...buffer].reverse().map((s) => {
              const origIndex = buffer.findIndex(b => b.localId === s.localId)
              const prevSame = buffer.slice(0, origIndex).filter(b => b.id_ejer === s.id_ejer).length
              const numSerie = contarSeriesExistentes(s.id_ejer, fecha) + prevSame + 1
              return (
                <SerieItem
                  key={s.localId}
                  s={s}
                  numSerie={numSerie}
                  onDelete={() => setBuffer(prev => prev.filter(b => b.localId !== s.localId))}
                  showCamposExtra={serieCamposExtra}
                />
              )
            })}
          </div>
        )}

        {/* GUARDAR SERIES */}
        <BtnGuardar onClick={guardarTodo} isLoading={guardando} />
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 440, marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          onClick={() => { setModalOpen(true); setModalMode('resumen') }}
          style={{ color: '#c8f135', fontSize: '0.72rem', letterSpacing: 1, textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Cargando...' : `${totalReg} reg${lastDate ? ` · ${isoToDisplay(lastDate)}` : ''}`}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setModalOpen(true); setModalMode('resumen') }}
          style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, color: '#c8f135', fontSize: '1.3rem', width: 44, height: 44, flexShrink: 0, cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#c8f135')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2e2e2e')}
          title="Ver registros"
        >
          ⊞
        </button>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%',
        transform: `translateX(-50%) translateY(${toast ? 0 : 80}px)`,
        background: '#c8f135', color: '#0e0e0e', ...BB,
        fontSize: '1rem', letterSpacing: 2, padding: '12px 28px',
        borderRadius: 999, transition: 'transform 0.3s ease',
        pointerEvents: 'none', zIndex: 300, whiteSpace: 'nowrap',
      }}>
        {toast ?? ''}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <HistorialModal
          porFecha={porFecha}
          registros={entrenamientosFiltrados}
          mode={modalMode}
          setMode={setModalMode}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          showCamposExtra={serieCamposExtra}
          ejercicios={ejercicios}
          onBorrar={async (id) => {
            const { error } = await borrarEntrenamiento(id)
            if (error) showToast('Error al borrar')
            else showToast('Registro eliminado')
          }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {showPerfil && (
        <PerfilModal
          form={perfilForm}
          setForm={(v) => { setPerfilForm(v); setPerfilFechaError('') }}
          cargando={cargandoPerfil}
          guardando={guardandoPerfil}
          fechaError={perfilFechaError}
          onGuardar={guardarPerfil}
          onClose={() => setShowPerfil(false)}
        />
      )}

      {showEditMeta && (
        <EditMetaModal
          valor={editMetaVal}
          setValor={setEditMetaVal}
          guardando={guardandoMeta}
          onGuardar={guardarMetaSemanal}
          onClose={() => setShowEditMeta(false)}
        />
      )}

      {showCalendario && (
        <CalendarioModal entrenamientos={entrenamientos} metaSemanal={metaSemanal} fechaInicioMeta={fechaInicioMeta} onClose={() => setShowCalendario(false)} />
      )}
    </div>
  )
}

// ─── Button components ────────────────────────────────────────────────────────

function BtnAdd({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', background: '#c8f135', border: 'none', borderRadius: 10, color: '#0e0e0e', ...BB, fontSize: '1.3rem', letterSpacing: 3, padding: 14, cursor: 'pointer', marginBottom: 16, opacity: hov ? 0.88 : 1, transition: 'opacity 0.2s, transform 0.1s' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      + AÑADIR SERIE
    </button>
  )
}

function BtnGuardar({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  const [hov, setHov] = useState(false)
  const active = hov && !isLoading
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{ width: '100%', background: active ? '#c8f135' : '#1a1a1a', border: '2px solid #c8f135', borderRadius: 10, color: active ? '#0e0e0e' : '#c8f135', ...BB, fontSize: '1.3rem', letterSpacing: 3, padding: 14, cursor: 'pointer', transition: 'background 0.2s, color 0.2s', opacity: isLoading ? 0.6 : 1 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {isLoading ? 'GUARDANDO...' : '💾 GUARDAR SERIES'}
    </button>
  )
}

// ─── Historial Modal ──────────────────────────────────────────────────────────

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? '#c8f135' : 'none',
        border: `1px solid ${active ? '#c8f135' : '#2e2e2e'}`,
        borderRadius: 6, color: active ? '#0e0e0e' : '#666',
        ...BB, fontSize: '0.85rem', letterSpacing: 1,
        padding: '5px 10px', cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function RecordDelBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{ background: hov ? 'rgba(255,85,85,0.15)' : 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'background 0.15s', lineHeight: 0, flexShrink: 0 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <IconTrash size={22} />
    </button>
  )
}

function HistorialModal({
  porFecha, registros, mode, setMode,
  busqueda, setBusqueda, onBorrar, onClose, showCamposExtra, ejercicios,
}: {
  porFecha: { fecha: string; ejercicios: string[] }[]
  registros: Entrenamiento[]
  mode: 'resumen' | 'detalle'
  setMode: (m: 'resumen' | 'detalle') => void
  busqueda: string
  setBusqueda: (v: string) => void
  onBorrar: (id: string) => void
  onClose: () => void
  showCamposExtra: boolean
  ejercicios: Ejercicio[]
}) {

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, width: '100%', maxWidth: 500, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #2e2e2e', position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 1 }}>
          <span style={{ ...BB, fontSize: '1.4rem', letterSpacing: 2, color: '#c8f135' }}>Registros</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <ModeBtn active={mode === 'resumen'} onClick={() => setMode('resumen')}>Resumen</ModeBtn>
            <ModeBtn active={mode === 'detalle'} onClick={() => setMode('detalle')}>Detalle</ModeBtn>
            <button
              onClick={onClose}
              style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', fontSize: '1rem', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = '#f0f0f0' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}
            >✕</button>
          </div>
        </div>

        {/* Search — detalle only */}
        {mode === 'detalle' && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #2e2e2e' }}>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por ejercicio o fecha..."
              style={{ width: '100%', background: '#0e0e0e', border: '1px solid #2e2e2e', borderRadius: 8, color: '#f0f0f0', fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '0.9rem', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#c8f135')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2e2e2e')}
            />
          </div>
        )}

        {/* List */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {mode === 'resumen' ? (
            porFecha.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>Sin registros</div>
              : porFecha.map(({ fecha, ejercicios }) => (
                <div key={fecha} style={{ padding: '16px 20px', borderBottom: '1px solid #2e2e2e' }}>
                  <div style={{ ...BB, fontSize: '1.4rem', color: '#c8f135', letterSpacing: 1, marginBottom: 4 }}>
                    {diasDesde(fecha)}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#f0f0f0' }}>
                    {ejercicios.join(', ')}
                  </div>
                </div>
              ))
          ) : (
            registros.length === 0
              ? <div style={{ padding: 32, textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>Sin registros</div>
              : registros.map(e => {
                const dias = diasDesde(e.fecha)
                const esHoy = dias === 'Hoy'
                return (
                  <div
                    key={e.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #2e2e2e', gap: 12, transition: 'background 0.15s' }}
                    onMouseEnter={el => (el.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ ...BB, fontSize: '1.1rem', color: '#c8f135', minWidth: 36, textAlign: 'center' }}>
                      S{e.serie}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1.2rem', color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {ejercicios.find(ej => ej.id_ejer === e.id_ejer)?.descripcion ?? ''}
                        {!esHoy && (
                          <span style={{ ...BB, fontSize: '1.5rem', color: '#c8f135', fontWeight: 'normal', letterSpacing: 1 }}> {dias}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '1.2rem', color: '#666', marginTop: 4 }}>
                        {isoToDisplay(e.fecha)} · {e.peso != null ? `${e.peso}kg` : 'sin peso'} · {e.repeticiones} reps{showCamposExtra ? ` · Fallo: ${e.fallo} · RIR: ${e.reserva ?? 0}` : ''}
                      </div>
                    </div>
                    <RecordDelBtn onClick={() => onBorrar(e.id)} />
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Edit Meta Modal ──────────────────────────────────────────────────────────

function EditMetaModal({
  valor, setValor, guardando, onGuardar, onClose,
}: {
  valor: string
  setValor: (v: string) => void
  guardando: boolean
  onGuardar: () => void
  onClose: () => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, width: '100%', maxWidth: 440, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #2e2e2e' }}>
          <span style={{ ...BB, fontSize: '1.4rem', letterSpacing: 2, color: '#c8f135' }}>Objetivo Semanal</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', fontSize: '1rem', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>Días por semana</div>
            <input
              type="number" min="1" max="7"
              value={valor}
              onChange={e => setValor(e.target.value)}
              style={{ ...INPUT, fontSize: '1.4rem' }}
              onFocus={focusAccent}
              onBlur={blurAccent}
            />
          </div>

          <div style={{ background: '#1a0a00', border: '1px solid #7a4a00', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ color: '#f5a623', fontSize: '0.78rem', lineHeight: 1.5 }}>
              ⚠ Al guardar, tus rachas serán calculadas a partir de hoy.
            </div>
          </div>

          <button
            onClick={onGuardar}
            disabled={guardando}
            style={{ background: '#c8f135', border: 'none', borderRadius: 10, color: '#0e0e0e', ...BB, fontSize: '1.2rem', letterSpacing: 3, padding: 14, cursor: 'pointer', opacity: guardando ? 0.6 : 1, transition: 'opacity 0.2s' }}
          >
            {guardando ? 'GUARDANDO...' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Calendario Modal ────────────────────────────────────────────────────────

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // 0=lun, 6=dom
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function calISOWeekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dow = date.getDay() || 7
  date.setDate(date.getDate() + 4 - dow)
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getFullYear()}-${String(weekNum).padStart(2, '0')}`
}

function CalendarioModal({ entrenamientos, metaSemanal, fechaInicioMeta, onClose }: {
  entrenamientos: Entrenamiento[]
  metaSemanal: number
  fechaInicioMeta: string | null
  onClose: () => void
}) {
  const activeDays = new Set(entrenamientos.map(e => e.fecha))

  // Construir mapa weekKey → número de días activos
  const weekActiveCounts = new Map<string, number>()
  for (const day of activeDays) {
    const wk = calISOWeekKey(day)
    weekActiveCounts.set(wk, (weekActiveCounts.get(wk) ?? 0) + 1)
  }
  const minWeekKey = fechaInicioMeta ? calISOWeekKey(fechaInicioMeta) : null

  const now = new Date()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()

  // Rango: desde el mes del entrenamiento más antiguo hasta hoy
  const oldest = entrenamientos.length ? entrenamientos[entrenamientos.length - 1].fecha : null
  let startY = todayY, startM = todayM
  if (oldest) {
    const [oy, om] = oldest.split('-').map(Number)
    startY = oy; startM = om - 1
  }

  const months: { year: number; month: number }[] = []
  let y = startY, m = startM
  while (y < todayY || (y === todayY && m <= todayM)) {
    months.push({ year: y, month: m })
    m++; if (m > 11) { m = 0; y++ }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #2e2e2e' }}>
          <span style={{ ...BB, fontSize: '1.4rem', letterSpacing: 2, color: '#c8f135' }}>Actividad</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', fontSize: '1rem', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}
          >✕</button>
        </div>

        {/* Months */}
        <div style={{ padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 20px' }}>
          {months.map(({ year, month }) => {
            const cells = buildMonthCells(year, month)
            // Agrupar celdas en filas de 7 (semanas)
            const rows: (number | null)[][] = []
            for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

            return (
              <div key={`${year}-${month}`}>
                <div style={{ ...BB, fontSize: '2.2rem', color: '#f0f0f0', lineHeight: 1, marginBottom: 10 }}>
                  {MESES[month]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {rows.map((row, ri) => {
                    // Determinar si esta semana cumple la meta
                    const firstDay = row.find(d => d !== null)
                    let weekMet = false
                    if (firstDay != null) {
                      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(firstDay).padStart(2, '0')}`
                      const wk = calISOWeekKey(iso)
                      const count = weekActiveCounts.get(wk) ?? 0
                      const afterMin = minWeekKey === null || wk >= minWeekKey
                      weekMet = afterMin && count >= metaSemanal
                    }
                    return (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 16px', gap: 4, alignItems: 'center' }}>
                        {row.map((day, i) => {
                          if (day === null) return <div key={i} />
                          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                          const active = activeDays.has(iso)
                          return (
                            <div key={i} style={{
                              aspectRatio: '1',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 8,
                              background: active ? '#3B82F6' : '#141414',
                              border: active ? 'none' : '1px solid #222',
                              color: active ? '#fff' : '#333',
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-dm-sans), sans-serif',
                              fontWeight: active ? 600 : 400,
                            }}>
                              {day}
                            </div>
                          )
                        })}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#c8f135', fontWeight: 700 }}>
                          {weekMet ? '✓' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Perfil Modal ─────────────────────────────────────────────────────────────

function PerfilModal({
  form, setForm, cargando, guardando, fechaError, onGuardar, onClose,
}: {
  form: { fecha_nacimiento: string; peso: string; serie_campos_extra: boolean }
  setForm: (v: { fecha_nacimiento: string; peso: string; serie_campos_extra: boolean }) => void
  cargando: boolean
  guardando: boolean
  fechaError: string
  onGuardar: () => void
  onClose: () => void
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, padding: '20px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, width: '100%', maxWidth: 440, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #2e2e2e' }}>
          <span style={{ ...BB, fontSize: '1.4rem', letterSpacing: 2, color: '#c8f135' }}>Mi Perfil</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #2e2e2e', borderRadius: 6, color: '#666', fontSize: '1rem', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f0'; e.currentTarget.style.borderColor = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = '#2e2e2e' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {cargando ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '32px 0', fontSize: '0.9rem' }}>Cargando...</div>
          ) : (
            <>
              {/* Fecha de nacimiento */}
              <div>
                <div style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>Fecha de nacimiento</div>
                <input
                  type="text"
                  value={form.fecha_nacimiento}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                    let fmt = digits
                    if (digits.length > 4) fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
                    else if (digits.length > 2) fmt = `${digits.slice(0, 2)}/${digits.slice(2)}`
                    setForm({ ...form, fecha_nacimiento: fmt })
                  }}
                  placeholder="DD/MM/YYYY"
                  style={{ ...INPUT, fontSize: '1.4rem', borderColor: fechaError ? '#ff5555' : undefined }}
                  onFocus={focusAccent}
                  onBlur={blurAccent}
                />
                {fechaError && (
                  <div style={{ color: '#ff5555', fontSize: '0.75rem', marginTop: 6, letterSpacing: '0.5px' }}>{fechaError}</div>
                )}
              </div>

              {/* Peso corporal */}
              <div>
                <div style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>Peso (kg)</div>
                <input
                  type="number" min="0" step="0.1"
                  value={form.peso}
                  onChange={e => setForm({ ...form, peso: e.target.value })}
                  placeholder="70"
                  style={{ ...INPUT, fontSize: '1.4rem' }}
                  onFocus={focusAccent}
                  onBlur={blurAccent}
                />
              </div>

              {/* Fallo muscular y RIR */}
              <div>
                <div style={{ fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#666', marginBottom: 8 }}>Grabar fallo muscular y RIR</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <ToggleSwitch checked={form.serie_campos_extra} onChange={v => setForm({ ...form, serie_campos_extra: v })} />
                  <span style={{ fontSize: '0.95rem', color: form.serie_campos_extra ? '#c8f135' : '#666', transition: 'color 0.2s' }}>
                    {form.serie_campos_extra ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Guardar */}
              <button
                onClick={onGuardar}
                disabled={guardando}
                style={{ background: '#c8f135', border: 'none', borderRadius: 10, color: '#0e0e0e', ...BB, fontSize: '1.2rem', letterSpacing: 3, padding: 14, cursor: 'pointer', opacity: guardando ? 0.6 : 1, transition: 'opacity 0.2s' }}
              >
                {guardando ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
