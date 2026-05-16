import { NextRequest, NextResponse } from 'next/server'
import { getRemainingTime } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, wlanuserip, csrfhw, attributeUuid, cookies } = await req.json()

    if (!username || !wlanuserip || !csrfhw || !attributeUuid || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros de sesión activa.' },
        { status: 400 }
      )
    }

    const { remainingTime, remainingSeconds } = await getRemainingTime({
      username,
      wlanuserip,
      csrfhw,
      attributeUuid,
      cookies,
    })

    return NextResponse.json({ remainingTime, remainingSeconds }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/remaining]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}