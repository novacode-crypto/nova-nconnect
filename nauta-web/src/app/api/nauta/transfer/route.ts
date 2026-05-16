import { NextRequest, NextResponse } from 'next/server'
import { transferBalance } from '@/lib/nauta-client'

export async function POST(req: NextRequest) {
  try {
    const { username, password, targetAccount, amount, cookies } = await req.json()

    if (!username || !password || !targetAccount || !amount || !cookies) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Se requiere username, password, targetAccount, amount y cookies.' },
        { status: 400 }
      )
    }

    const validDomains = ['@nauta.com.cu', '@nauta.co.cu']
    if (!validDomains.some(d => targetAccount.endsWith(d))) {
      return NextResponse.json(
        { error: 'La cuenta destino debe terminar en @nauta.com.cu o @nauta.co.cu' },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número positivo.' },
        { status: 400 }
      )
    }

    if (targetAccount === username) {
      return NextResponse.json(
        { error: 'No puedes transferir saldo a tu propia cuenta.' },
        { status: 400 }
      )
    }

    await transferBalance({ username, password, targetAccount, amount: parsedAmount, cookies })

    return NextResponse.json(
      { success: true, message: `Transferencia de $${parsedAmount.toFixed(2)} realizada exitosamente.` },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[/api/nauta/transfer]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}