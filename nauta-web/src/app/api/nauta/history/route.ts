import { NextRequest, NextResponse } from 'next/server'
import { getConnectionHistory } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, password, type, cookies } = await req.json()

    // type: 'connections' | 'recharges' | 'transfers'
    if (!username || !password || !type || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Se requiere username, password, type y cookies.' },
        { status: 400 }
      )
    }

    if (!['connections', 'recharges', 'transfers'].includes(type)) {
      return NextResponse.json(
        { error: 'El campo type debe ser "connections", "recharges" o "transfers".' },
        { status: 400 }
      )
    }

    const history = await getConnectionHistory({ username, password, type, cookies })

    return NextResponse.json({ history }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/history]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}