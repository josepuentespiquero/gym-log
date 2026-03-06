import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password` },
  })

  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: 'generateLink failed', detail: error?.message }, { status: 500 })
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token_hash=${data.properties.hashed_token}&type=recovery`

  const { error: emailError } = await resend.emails.send({
    from: 'gymlog@contact.sialguien.com',
    to: email,
    subject: 'Restablecer contraseña — Gym Log',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #c8f135; font-size: 28px; margin-bottom: 16px;">GYM LOG</h2>
        <p style="color: #333; margin-bottom: 24px;">
          Haz clic en el siguiente enlace para elegir una nueva contraseña.
          El enlace expirará en 1 hora.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #c8f135; color: #0e0e0e;
                  padding: 14px 28px; border-radius: 8px; text-decoration: none;
                  font-weight: bold; font-size: 16px;">
          Restablecer contraseña
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Si no solicitaste este cambio, ignora este email.
        </p>
      </div>
    `,
  })

  if (emailError) {
    return NextResponse.json({ error: 'resend failed', detail: emailError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
