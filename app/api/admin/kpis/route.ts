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
    { data: usuarios },
    { data: lastActivities },
    { count: newThisWeek },
  ] = await Promise.all([
    supabaseAdmin.from('usuarios').select('email, created_at').order('created_at', { ascending: false }),
    supabaseAdmin.from('entrenamientos').select('usuario, created_at'),
    supabaseAdmin.from('usuarios').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])

  // Group by usuario, find most recent activity per user
  const lastByUser = new Map<string, string>()
  for (const e of lastActivities ?? []) {
    const prev = lastByUser.get(e.usuario)
    if (!prev || e.created_at > prev) lastByUser.set(e.usuario, e.created_at)
  }

  // Count users active in the last 7 days
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  let activeUsers = 0
  for (const lastActivity of lastByUser.values()) {
    if (new Date(lastActivity).getTime() >= cutoff) activeUsers++
  }

  const now = Date.now()
  const userList = (usuarios ?? []).map(u => ({
    email: u.email,
    diasDesdeRegistro: Math.floor((now - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24)),
  }))

  return NextResponse.json({
    totalUsers: userList.length,
    activeUsers,
    newThisWeek: newThisWeek ?? 0,
    usuarios: userList,
  })
}
