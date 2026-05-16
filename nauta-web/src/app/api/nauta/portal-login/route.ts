import { NextRequest, NextResponse } from 'next/server'
import { submitPortalCaptcha } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, password, captcha, csrf, cookies } = await req.json()

    if (!username || !password || !captcha || !csrf || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Se requiere username, password, captcha, csrf y cookies.' },
        { status: 400 }
      )
    }

    if (typeof captcha !== 'string' || captcha.trim().length === 0) {
      return NextResponse.json(
        { error: 'El captcha no puede estar vacío.' },
        { status: 400 }
      )
    }

    const { cookies: newCookies } = await submitPortalCaptcha({
      username,
      password,
      captcha: captcha.trim(),
      csrf,
      cookies,
    })

    return NextResponse.json(
      { success: true, cookies: newCookies },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/portal-login]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}