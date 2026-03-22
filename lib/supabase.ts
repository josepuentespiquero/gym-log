import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { flowType: 'implicit' } }
)

export interface Ejercicio {
  id_ejer: number
  id_user?: number | null
  descripcion: string
  estandar: boolean
  proponer: boolean
}

export interface Entrenamiento {
  id: string
  fecha: string      // YYYY-MM-DD
  id_ejer: number
  peso: number | null
  serie: number
  repeticiones: number
  fallo: 'S' | 'N'
  reserva: number | null
  id_user: number
  created_at: string
}
