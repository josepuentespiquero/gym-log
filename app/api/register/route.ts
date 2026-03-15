import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { email, password } = await request.json()
    if (!email || !password) return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm` },
    })

    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json({ error: 'generateLink failed', detail: error?.message }, { status: 500 })
    }

    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=signup`

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Confirma tu cuenta — Gym Log',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #c8f135; font-size: 28px; margin-bottom: 16px;">GYM LOG</h2>
          <p style="color: #333; margin-bottom: 24px;">
            Haz clic en el siguiente enlace para confirmar tu cuenta.
            El enlace expirará en 24 horas.
          </p>
          <a href="${confirmUrl}"
             style="display: inline-block; background: #c8f135; color: #0e0e0e;
                    padding: 14px 28px; border-radius: 8px; text-decoration: none;
                    font-weight: bold; font-size: 16px;">
            Confirmar cuenta
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Si no creaste esta cuenta, ignora este email.
          </p>
        </div>
      `,
    })

    if (emailError) {
      return NextResponse.json({ error: 'resend failed', detail: emailError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: 'uncaught', detail: msg }, { status: 500 })
  }
}
