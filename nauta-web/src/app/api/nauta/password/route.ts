import { NextRequest, NextResponse } from 'next/server'
import { changePassword } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, oldPassword, newPassword, type, cookies } = await req.json()

    // type: 'account' | 'email'
    if (!username || !oldPassword || !newPassword || !type || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Se requiere username, oldPassword, newPassword, type y cookies.' },
        { status: 400 }
      )
    }

    if (!['account', 'email'].includes(type)) {
      return NextResponse.json(
        { error: 'El campo type debe ser "account" o "email".' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      )
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual.' },
        { status: 400 }
      )
    }

    await changePassword({ username, oldPassword, newPassword, type, cookies })

    const label = type === 'account' ? 'de la cuenta Nauta' : 'del correo'
    return NextResponse.json(
      { success: true, message: `Contraseña ${label} actualizada exitosamente.` },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/password]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}