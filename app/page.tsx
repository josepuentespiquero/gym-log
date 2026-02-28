'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useEntrenamientos } from '@/hooks/useEntrenamientos'
import { supabase, Entrenamiento } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Constants ───────────────────────────────────────────────────────────────

const EJERCICIOS = [
  'Biceps', 'Cuádriceps', 'Dominadas', 'Espalda', 'Flexiones',
  'Fly', 'Fondos', 'Hombro', 'Pecho', 'Plancha Glúteos', 'Triceps',
]

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
  ejercicio: string
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

function SerieItem({ s, numSerie, onDelete }: { s: SeriePendiente; numSerie: number; onDelete: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ background: '#0e0e0e', border: '1px solid #2e2e2e', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, animation: 'slideIn 0.2s ease' }}>
      <span style={{ ...BB, fontSize: '1.5rem', color: '#c8f135', minWidth: 36 }}>S{numSerie}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '1rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#f0f0f0', marginBottom: 4, fontWeight: 500 }}>
          {s.ejercicio}
        </div>
        <div style={{ color: '#f0f0f0', fontSize: '1.25rem', fontWeight: 500 }}>
          {s.repeticiones} reps{s.peso != null ? ` · ${s.peso} kg` : ''} · Fallo: {s.fallo}{s.fallo === 'N' ? ` · RIR: ${s.reserva}` : ''}
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const { entrenamientos, loading, guardarSeries, borrarEntrenamiento, getUltimaSesion, contarSeriesExistentes } = useEntrenamientos()
  const router = useRouter()

  // Auth
  const [userEmail, setUserEmail] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email ?? null))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Form state — empty string on server to avoid timezone-based hydration mismatch
  const [fecha, setFecha] = useState('')
  useEffect(() => { setFecha(fechaHoy()) }, [])
  const [ejercicioSelect, setEjercicioSelect] = useState(EJERCICIOS[0])
  const [esCustom, setEsCustom] = useState(false)
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

  const ejercicioActual = esCustom ? ejercicioCustom.trim() : ejercicioSelect

  const ultimaSesion = useMemo(
    () => (ejercicioActual ? getUltimaSesion(ejercicioActual) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ejercicioActual, entrenamientos]
  )
  const serie1 = ultimaSesion.find(s => s.serie === 1) ?? ultimaSesion[0] ?? null

  function handleEjercicioChange(val: string) {
    if (val === '__otro__') {
      setEsCustom(true)
      setEjercicioCustom('')
    } else {
      setEsCustom(false)
      setEjercicioSelect(val)
      // Auto-fill from last session
      const last = getUltimaSesion(val)
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

  function añadirSerie() {
    const reps = parseInt(repeticiones)
    if (!reps || reps < 1) { showToast('Introduce las repeticiones'); return }
    if (!ejercicioActual) { showToast('Selecciona un ejercicio'); return }
    setBuffer(prev => [...prev, {
      localId: crypto.randomUUID(),
      ejercicio: ejercicioActual,
      peso: peso !== '' ? parseFloat(peso) : null,
      repeticiones: reps,
      fallo,
      reserva: fallo === 'N' && reserva !== '' ? parseInt(reserva) : 0,
    }])
    setRepeticiones('')
    setFallo('N')
    setReserva('')
  }

  async function guardarTodo() {
    if (!buffer.length) { showToast('Añade al menos una serie'); return }
    setGuardando(true)
    const porEjercicio: Record<string, SeriePendiente[]> = {}
    for (const s of buffer) {
      if (!porEjercicio[s.ejercicio]) porEjercicio[s.ejercicio] = []
      porEjercicio[s.ejercicio].push(s)
    }
    const series = Object.entries(porEjercicio).flatMap(([ej, items]) => {
      const existentes = contarSeriesExistentes(ej, fecha)
      return items.map((s, i) => ({
        fecha, ejercicio: ej, peso: s.peso,
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
      g[e.fecha].add(e.ejercicio)
    }
    return Object.entries(g)
      .map(([f, ejs]) => ({ fecha: f, ejercicios: [...ejs].sort() }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [entrenamientos])

  const entrenamientosFiltrados = useMemo(() => {
    const all = [...entrenamientos].sort((a, b) =>
      b.fecha.localeCompare(a.fecha) ||
      a.ejercicio.localeCompare(b.ejercicio, 'es') ||
      a.serie - b.serie
    )
    if (!busqueda) return all
    const q = busqueda.toLowerCase()
    return all.filter(e =>
      e.ejercicio.toLowerCase().includes(q) ||
      e.fecha.includes(q) ||
      isoToDisplay(e.fecha).includes(q)
    )
  }, [entrenamientos, busqueda])

  const totalReg = entrenamientos.length + buffer.length
  const lastDate = entrenamientos[0]?.fecha ?? null

  return (
    <div style={{ background: '#0e0e0e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ ...BB, fontSize: '3.5rem', color: '#c8f135', letterSpacing: 4, lineHeight: 1 }}>GYM LOG</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {userEmail && (
              <span style={{ color: '#666', fontSize: '0.75rem', letterSpacing: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
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

      {/* ── Card ──────────────────────────────────────────────────── */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: 10, padding: 32, width: '100%', maxWidth: 440 }}>

        {/* FECHA */}
        <Field label="Fecha">
          <FechaWrapper fecha={fecha} onFechaChange={setFecha} />
        </Field>

        {/* EJERCICIO */}
        <Field label="Ejercicio">
          <div style={{ position: 'relative' }}>
            <select
              value={esCustom ? '__otro__' : ejercicioSelect}
              onChange={e => handleEjercicioChange(e.target.value)}
              style={INPUT}
              onFocus={focusAccent}
              onBlur={blurAccent}
            >
              {EJERCICIOS.map(ej => <option key={ej} value={ej}>{ej}</option>)}
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
        </Field>

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
        <Field label="Fallo muscular">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ToggleSwitch checked={fallo === 'S'} onChange={v => setFallo(v ? 'S' : 'N')} />
            <span style={{ fontSize: '0.95rem', color: fallo === 'S' ? '#c8f135' : '#666', fontWeight: fallo === 'S' ? 500 : 400, transition: 'color 0.2s' }}>
              {fallo === 'S' ? 'Sí — fallo muscular' : 'No'}
            </span>
          </div>
        </Field>

        {/* RESERVA (RIR) — dimmed when fallo=S */}
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
            {buffer.map((s, i) => {
              const prevSame = buffer.slice(0, i).filter(b => b.ejercicio === s.ejercicio).length
              const numSerie = contarSeriesExistentes(s.ejercicio, fecha) + prevSame + 1
              return (
                <SerieItem
                  key={s.localId}
                  s={s}
                  numSerie={numSerie}
                  onDelete={() => setBuffer(prev => prev.filter(b => b.localId !== s.localId))}
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
          onBorrar={async (id) => {
            const { error } = await borrarEntrenamiento(id)
            if (error) showToast('Error al borrar')
            else showToast('Registro eliminado')
          }}
          onClose={() => setModalOpen(false)}
        />
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

function RecordDelBtn({ isConfirm, onClick }: { isConfirm: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  if (isConfirm) {
    return (
      <button
        onClick={onClick}
        style={{ background: 'rgba(255,85,85,0.12)', border: '1px solid #ff5555', borderRadius: 6, cursor: 'pointer', padding: '5px 8px', lineHeight: 0, flexShrink: 0 }}
      >
        <span style={{ ...BB, fontSize: '0.85rem', letterSpacing: 1, color: '#ff5555' }}>¿BORRAR?</span>
      </button>
    )
  }
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
  busqueda, setBusqueda, onBorrar, onClose,
}: {
  porFecha: { fecha: string; ejercicios: string[] }[]
  registros: Entrenamiento[]
  mode: 'resumen' | 'detalle'
  setMode: (m: 'resumen' | 'detalle') => void
  busqueda: string
  setBusqueda: (v: string) => void
  onBorrar: (id: string) => void
  onClose: () => void
}) {
  const [confirmSet, setConfirmSet] = useState<Set<string>>(new Set())

  function handleDelete(id: string) {
    if (confirmSet.has(id)) {
      onBorrar(id)
      setConfirmSet(prev => { const s = new Set(prev); s.delete(id); return s })
    } else {
      setConfirmSet(prev => new Set([...prev, id]))
      setTimeout(() => {
        setConfirmSet(prev => { const s = new Set(prev); s.delete(id); return s })
      }, 3000)
    }
  }

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
                        {e.ejercicio}
                        {!esHoy && (
                          <span style={{ ...BB, fontSize: '1.5rem', color: '#c8f135', fontWeight: 'normal', letterSpacing: 1 }}> {dias}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 4 }}>
                        {isoToDisplay(e.fecha)} · {e.peso != null ? `${e.peso}kg` : 'sin peso'} · {e.repeticiones} reps · Fallo: {e.fallo} · RIR: {e.reserva ?? 0}
                      </div>
                    </div>
                    <RecordDelBtn isConfirm={confirmSet.has(e.id)} onClick={() => handleDelete(e.id)} />
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
