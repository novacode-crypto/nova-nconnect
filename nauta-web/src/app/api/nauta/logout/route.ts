import { NextRequest, NextResponse } from 'next/server'
import { logoutNauta } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, wlanuserip, csrfhw, attributeUuid, cookies } = await req.json()

    if (!username || !wlanuserip || !csrfhw || !attributeUuid || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros de sesión activa.' },
        { status: 400 }
      )
    }

    await logoutNauta({
      username,
      wlanuserip,
      csrfhw,
      attributeUuid,
      cookies,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/logout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}