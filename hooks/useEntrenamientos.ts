'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, Entrenamiento, Ejercicio } from '@/lib/supabase'

export interface Nivel {
  id: number
  nombre_nivel: string
  numero_rachas: number
  icono: string
}

export interface NuevaSerie {
  fecha: string
  id_ejer: number
  peso: number | null
  serie: number
  repeticiones: number
  fallo: 'S' | 'N'
  reserva: number | null
}

// ─── Habit tracking utilities ─────────────────────────────────────────────────

type EstadoSemana = 'achieved' | 'partial' | 'empty' | 'future'

function getISOWeekKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayOfWeek = date.getDay() || 7
  date.setDate(date.getDate() + 4 - dayOfWeek)
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getFullYear()}-${String(weekNum).padStart(2, '0')}`
}

function getPreviousWeekKey(weekKey: string): string {
  const [year, week] = weekKey.split('-').map(Number)
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7
  const weekOneMonday = new Date(year, 0, 4 - jan4Day + 1)
  const targetMonday = new Date(weekOneMonday.getTime() + (week - 1) * 7 * 86400000)
  const prevMonday = new Date(targetMonday.getTime() - 7 * 86400000)
  const py = prevMonday.getFullYear()
  const pm = String(prevMonday.getMonth() + 1).padStart(2, '0')
  const pd = String(prevMonday.getDate()).padStart(2, '0')
  return getISOWeekKey(`${py}-${pm}-${pd}`)
}

function buildWeekDates(entrenamientos: Entrenamiento[]): Map<string, Set<string>> {
  const weekDates = new Map<string, Set<string>>()
  for (const e of entrenamientos) {
    const wk = getISOWeekKey(e.fecha)
    if (!weekDates.has(wk)) weekDates.set(wk, new Set())
    weekDates.get(wk)!.add(e.fecha)
  }
  return weekDates
}

function calcularRacha(entrenamientos: Entrenamiento[], metaSemanal: number, fechaInicioMeta: string | null): number {
  if (!entrenamientos.length) return 0
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentWeek = getISOWeekKey(todayStr)
  const weekDates = buildWeekDates(entrenamientos)
  const currentCount = weekDates.get(currentWeek)?.size ?? 0
  let key = currentCount >= metaSemanal ? currentWeek : getPreviousWeekKey(currentWeek)
  const minWeekKey = fechaInicioMeta ? getISOWeekKey(fechaInicioMeta) : null
  let racha = 0
  while (true) {
    if (minWeekKey && key < minWeekKey) break
    if ((weekDates.get(key)?.size ?? 0) < metaSemanal) break
    racha++
    key = getPreviousWeekKey(key)
  }
  return racha
}

function calcularSesionesEstaSemana(entrenamientos: Entrenamiento[]): number {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentWeek = getISOWeekKey(todayStr)
  const dates = new Set<string>()
  for (const e of entrenamientos) {
    if (getISOWeekKey(e.fecha) === currentWeek) dates.add(e.fecha)
  }
  return dates.size
}

function calcularSemanasAnio(entrenamientos: Entrenamiento[], metaSemanal: number, fechaInicioMeta: string | null): EstadoSemana[] {
  const now = new Date()
  const year = now.getFullYear()
  const todayStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentWeek = getISOWeekKey(todayStr)
  const weekDates = buildWeekDates(entrenamientos)
  const minWeekKey = fechaInicioMeta ? getISOWeekKey(fechaInicioMeta) : null

  // Determine total weeks in the year (52 or 53)
  const dec28 = new Date(year, 11, 28)
  const dec28Day = dec28.getDay() || 7
  dec28.setDate(dec28.getDate() + 4 - dec28Day)
  const yearStart = new Date(year, 0, 1)
  const totalWeeks = Math.ceil(((dec28.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)

  const result: EstadoSemana[] = []
  for (let w = 1; w <= totalWeeks; w++) {
    const weekKey = `${year}-${String(w).padStart(2, '0')}`
    if (weekKey > currentWeek) {
      result.push('future')
    } else if (minWeekKey && weekKey < minWeekKey) {
      result.push('empty')
    } else {
      const sessions = weekDates.get(weekKey)?.size ?? 0
      if (sessions >= metaSemanal) result.push('achieved')
      else if (sessions > 0) result.push('partial')
      else result.push('empty')
    }
  }
  return result
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEntrenamientos() {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([])
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metaSemanal, setMetaSemanal] = useState(3)
  const [fechaInicioMeta, setFechaInicioMeta] = useState<string | null>(null)
  const [serieCamposExtra, setSerieCamposExtra] = useState(false)
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [idUser, setIdUser] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)

    // 1. Obtener id_user del usuario activo antes de queries de datos
    const { data: { user } } = await supabase.auth.getUser()
    let currentIdUser: number | null = null
    if (user?.email) {
      const { data: userRow } = await supabase
        .from('usuarios')
        .select('id_user, meta_semanal, fecha_inicio_meta_semanal, serie_campos_extra')
        .eq('email', user.email)
        .single()
      if (userRow?.id_user) {
        currentIdUser = userRow.id_user
        setIdUser(userRow.id_user)
      }
      if (userRow?.meta_semanal) setMetaSemanal(userRow.meta_semanal)
      setFechaInicioMeta(userRow?.fecha_inicio_meta_semanal ?? null)
      setSerieCamposExtra(userRow?.serie_campos_extra ?? false)
    }

    // 2. Fetch entrenamientos filtrado explícitamente por id_user
    const [{ data, error }, { data: ejerciciosData }, { data: nivelesData }] = await Promise.all([
      supabase
        .from('entrenamientos')
        .select('*')
        .eq('id_user', currentIdUser ?? 0)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: true }),
      supabase
        .from('ejercicios_usuario')
        .select('id_ejer, id_user, descripcion, estandar, proponer')
        .or(`id_user.is.null,id_user.eq.${currentIdUser}`)
        .order('descripcion', { ascending: true }),
      supabase
        .from('niveles')
        .select('*')
        .order('numero_rachas', { ascending: true }),
    ])

    if (error) {
      setError(error.message)
    } else {
      setEntrenamientos(data ?? [])
    }
    setEjercicios((ejerciciosData ?? []) as Ejercicio[])
    setNiveles((nivelesData ?? []) as Nivel[])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const guardarSeries = useCallback(async (series: NuevaSerie[]) => {
    if (!idUser) return { error: 'No autenticado' }

    const seriesConUsuario = series.map(s => ({ ...s, id_user: idUser }))

    const { error } = await supabase
      .from('entrenamientos')
      .insert(seriesConUsuario)

    if (error) return { error: error.message }

    // Re-fetch para sincronizar, filtrado explícitamente por id_user
    const { data: fresh, error: fetchError } = await supabase
      .from('entrenamientos')
      .select('*')
      .eq('id_user', idUser)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: true })

    if (!fetchError && fresh) setEntrenamientos(fresh)

    return { error: null }
  }, [idUser])

  const borrarEntrenamiento = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('entrenamientos')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }

    setEntrenamientos(prev => prev.filter(e => e.id !== id))
    return { error: null }
  }, [])

  // Devuelve las series de la sesión más reciente para un ejercicio dado
  const getUltimaSesion = useCallback(
    (id_ejer: number): Entrenamiento[] => {
      const sesiones = entrenamientos.filter(e => e.id_ejer === id_ejer)
      if (!sesiones.length) return []

      const ultimaFecha = sesiones.reduce(
        (max, e) => (e.fecha > max ? e.fecha : max),
        sesiones[0].fecha
      )
      return sesiones
        .filter(e => e.fecha === ultimaFecha)
        .sort((a, b) => a.serie - b.serie)
    },
    [entrenamientos]
  )

  // Cuenta cuántas series ya existen para id_ejer+fecha en Supabase
  const contarSeriesExistentes = useCallback(
    (id_ejer: number, fecha: string): number =>
      entrenamientos.filter(e => e.id_ejer === id_ejer && e.fecha === fecha).length,
    [entrenamientos]
  )

  // ── Habit tracking ──────────────────────────────────────────────────────────
  const racha = useMemo(() => calcularRacha(entrenamientos, metaSemanal, fechaInicioMeta), [entrenamientos, metaSemanal, fechaInicioMeta])
  const sesionesEstaSemana = useMemo(() => calcularSesionesEstaSemana(entrenamientos), [entrenamientos])
  const semanasAnio = useMemo(() => calcularSemanasAnio(entrenamientos, metaSemanal, fechaInicioMeta), [entrenamientos, metaSemanal, fechaInicioMeta])

  return {
    entrenamientos,
    ejercicios,
    loading,
    error,
    guardarSeries,
    borrarEntrenamiento,
    getUltimaSesion,
    contarSeriesExistentes,
    refetch: fetchAll,
    racha,
    sesionesEstaSemana,
    metaSemanal,
    fechaInicioMeta,
    serieCamposExtra,
    niveles,
    semanasAnio,
    idUser,
  }
}
