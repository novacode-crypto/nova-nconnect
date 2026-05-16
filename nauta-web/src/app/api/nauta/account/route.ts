import { NextRequest, NextResponse } from 'next/server'
import { getPortalAccountData } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, cookies } = await req.json()

    if (!username || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Se requiere username y cookies de sesión del portal.' },
        { status: 400 }
      )
    }

    const accountData = await getPortalAccountData({ username, cookies })

    return NextResponse.json(accountData, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/account]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}