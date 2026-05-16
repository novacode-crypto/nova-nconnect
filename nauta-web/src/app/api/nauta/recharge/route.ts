import { NextRequest, NextResponse } from 'next/server'
import { rechargeAccount } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, password, rechargeCode, cookies } = await req.json()

    if (!username || !password || !rechargeCode || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Se requiere username, password, rechargeCode y cookies.' },
        { status: 400 }
      )
    }

    if (typeof rechargeCode !== 'string' || !/^\d{12,16}$/.test(rechargeCode)) {
      return NextResponse.json(
        { error: 'El código de recarga debe tener entre 12 y 16 dígitos numéricos.' },
        { status: 400 }
      )
    }

    await rechargeAccount({ username, password, rechargeCode, cookies })

    return NextResponse.json(
      { success: true, message: 'Recarga realizada exitosamente.' },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/recharge]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}