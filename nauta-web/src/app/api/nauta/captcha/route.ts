import { NextRequest, NextResponse } from 'next/server'
import { getPortalCaptcha } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username y password son requeridos.' },
        { status: 400 }
      )
    }

    const { captchaBase64, csrf, cookies } = await getPortalCaptcha(username, password)

    // Devuelve el CAPTCHA como base64 para renderizarlo en el frontend
    // junto con el csrf y cookies necesarios para el siguiente paso
    return NextResponse.json(
      {
        captchaBase64, // "data:image/png;base64,..."
        csrf,
        cookies,
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/captcha]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}