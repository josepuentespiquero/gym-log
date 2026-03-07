import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('email', user.email)
    .single()

  if (userData?.rol !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { data: activeUsers },
    { count: newThisWeek },
  ] = await Promise.all([
    supabaseAdmin.from('usuarios').select('*', { count: 'exact', head: true }),
    supabaseAdmin.rpc('get_active_users'),
    supabaseAdmin.from('usuarios').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeUsers: activeUsers ?? 0,
    newThisWeek: newThisWeek ?? 0,
  })
}
