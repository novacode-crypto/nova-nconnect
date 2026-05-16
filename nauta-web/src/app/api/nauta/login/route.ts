import { NextRequest, NextResponse } from 'next/server'
import { loginNauta } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, password, wlanuserip, csrfhw, cookies } = await req.json()

    if (!username || !password || !wlanuserip || !csrfhw || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros de sesión. Llama a /api/nauta/init primero.' },
        { status: 400 }
      )
    }

    const result = await loginNauta({
      username,
      password,
      wlanuserip,
      csrfhw,
      cookies,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/login]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}