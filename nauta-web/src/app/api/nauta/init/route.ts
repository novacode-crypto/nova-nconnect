import { NextResponse } from 'next/server'
import { initNautaSession } from '@/lib/nauta-client'

/**
 * GET /api/nauta/init
 *
 * Inicializa la sesión HTTP con el portal cautivo de Nauta.
 * Retorna: wlanuserip, csrfhw y las cookies de sesión.
 * El frontend guarda estos valores y los reenvía en cada petición posterior.
 */
export async function GET() {
  try {
    const result = await initNautaSession()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[/api/nauta/init]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}