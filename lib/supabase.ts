import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Entrenamiento {
  id: string
  fecha: string // YYYY-MM-DD
  ejercicio: string
  peso: number | null
  serie: number
  repeticiones: number
  fallo: 'S' | 'N'
  reserva: number | null
  created_at: string
}
