'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Entrenamiento } from '@/lib/supabase'

export interface NuevaSerie {
  fecha: string
  ejercicio: string
  peso: number | null
  serie: number
  repeticiones: number
  fallo: 'S' | 'N'
  reserva: number | null
}

export function useEntrenamientos() {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('entrenamientos')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setEntrenamientos(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const guardarSeries = useCallback(async (series: NuevaSerie[]) => {
    const { error } = await supabase
      .from('entrenamientos')
      .insert(series)

    if (error) return { error: error.message }

    // Re-fetch para sincronizar el estado local con la BD
    // (el insert+select puede devolver vacío con RLS activo)
    const { data: fresh, error: fetchError } = await supabase
      .from('entrenamientos')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: true })

    if (!fetchError && fresh) setEntrenamientos(fresh)

    return { error: null }
  }, [])

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
    (ejercicio: string): Entrenamiento[] => {
      const sesiones = entrenamientos.filter(e => e.ejercicio === ejercicio)
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

  // Cuenta cuántas series ya existen para ejercicio+fecha en Supabase
  const contarSeriesExistentes = useCallback(
    (ejercicio: string, fecha: string): number =>
      entrenamientos.filter(e => e.ejercicio === ejercicio && e.fecha === fecha).length,
    [entrenamientos]
  )

  return {
    entrenamientos,
    loading,
    error,
    guardarSeries,
    borrarEntrenamiento,
    getUltimaSesion,
    contarSeriesExistentes,
    refetch: fetchAll,
  }
}
