import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface Entrenamiento {
  id: string
  fecha: string      // YYYY-MM-DD
  ejercicio: string
  peso: number | null
  serie: number
  repeticiones: number
  fallo: 'S' | 'N'
  reserva: number | null
  usuario: string
  created_at: string
}
