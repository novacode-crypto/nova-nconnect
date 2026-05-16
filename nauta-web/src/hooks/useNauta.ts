'use client'

import { useState, useCallback, useRef } from 'react'
import type { SessionState } from '@/app/page'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface UseNautaReturn {
  status:           Status
  error:            string | null
  remainingTime:    string | null
  remainingSeconds: number | null

  initAndLogin:       (username: string, password: string) => Promise<SessionState | null>
  logout:             (session: SessionState) => Promise<boolean>
  fetchRemainingTime: (session: SessionState) => Promise<void>
  getCaptcha:         (username: string, password: string) => Promise<CaptchaData | null>
  submitCaptcha:      (data: SubmitCaptchaData) => Promise<PortalSession | null>
  getAccountData:     (session: SessionState) => Promise<AccountData | null>
  recharge:           (session: SessionState, code: string) => Promise<string | null>
  transfer:           (session: SessionState, target: string, amount: number) => Promise<string | null>
  changePassword:     (session: SessionState, oldPw: string, newPw: string, type: 'account' | 'email') => Promise<string | null>
  getHistory:         (session: SessionState, type: HistoryType) => Promise<HistoryData | null>
  clearError:         () => void
}

export interface CaptchaData {
  captchaBase64: string
  csrf:          string
  cookies:       Record<string, string>
  username:      string
  password:      string
}

export interface SubmitCaptchaData {
  username: string
  password: string
  captcha:  string
  csrf:     string
  cookies:  Record<string, string>
}

export interface PortalSession {
  cookies: Record<string, string>
}

export interface AccountData {
  username:          string
  blocking_date:     string
  elimination_date:  string
  account_type:      string
  service_type:      string
  available_balance: string
  remaining_time:    string
  email_account:     string
}

export type HistoryType = 'connections' | 'recharges' | 'transfers'

export type HistoryData = Record<string, Record<string, unknown>>

// ─── Helper de fetch contra nuestras API routes ───────────────────

async function apiFetch<T>(
  endpoint: string,
  body: object          // ← era Record<string, unknown>
): Promise<T> {
  const res = await fetch(`/api/nauta/${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? `Error ${res.status} en /api/nauta/${endpoint}`)
  }

  return data as T
}

// ─── Hook principal ───────────────────────────────────────────────

export function useNauta(): UseNautaReturn {
  const [status,           setStatus]           = useState<Status>('idle')
  const [error,            setError]            = useState<string | null>(null)
  const [remainingTime,    setRemainingTime]    = useState<string | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  // Ref para el intervalo de polling del tiempo restante
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setStatus('loading')
    setError(null)
    try {
      const result = await fn()
      setStatus('success')
      return result
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      setStatus('error')
      return null
    }
  }, [])

  // ── 1. Init + Login (flujo completo del portal cautivo) ──────────
  const initAndLogin = useCallback(
    async (username: string, password: string): Promise<SessionState | null> => {
      return run(async () => {
        // Paso 1: obtener tokens y userInfo
        const initData = await apiFetch<{
          wlanuserip: string
          csrfhw:     string
          cookies:    Record<string, string>
          userInfo:   SessionState['userInfo']
        }>('init', { username, password })

        // Paso 2: login
        const loginData = await apiFetch<{
          attributeUuid: string
          cookies:       Record<string, string>
        }>('login', {
          username,
          password,
          wlanuserip: initData.wlanuserip,
          csrfhw:     initData.csrfhw,
          cookies:    initData.cookies,
        })

        return {
          username,
          wlanuserip:    initData.wlanuserip,
          csrfhw:        initData.csrfhw,
          attributeUuid: loginData.attributeUuid,
          cookies:       loginData.cookies,
          loggedIn:      true,
          userInfo:      initData.userInfo,
        }
      })
    },
    [run]
  )

  // ── 2. Logout ────────────────────────────────────────────────────
  const logout = useCallback(
    async (session: SessionState): Promise<boolean> => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      const result = await run(async () => {
        await apiFetch('logout', {
          username:      session.username,
          wlanuserip:    session.wlanuserip,
          csrfhw:        session.csrfhw,
          attributeUuid: session.attributeUuid,
          cookies:       session.cookies,
        })
        return true
      })
      return result ?? false
    },
    [run]
  )

  // ── 3. Tiempo restante ───────────────────────────────────────────
  const fetchRemainingTime = useCallback(
    async (session: SessionState): Promise<void> => {
      await run(async () => {
        const data = await apiFetch<{ remainingTime: string; remainingSeconds: number }>(
          'remaining',
          {
            username:      session.username,
            wlanuserip:    session.wlanuserip,
            csrfhw:        session.csrfhw,
            attributeUuid: session.attributeUuid,
            cookies:       session.cookies,
          }
        )
        setRemainingTime(data.remainingTime)
        setRemainingSeconds(data.remainingSeconds)
      })
    },
    [run]
  )

  // ── 4. CAPTCHA del portal ────────────────────────────────────────
  const getCaptcha = useCallback(
    async (username: string, password: string): Promise<CaptchaData | null> => {
      return run(() =>
        apiFetch<CaptchaData>('captcha', { username, password })
      )
    },
    [run]
  )

  // ── 5. Submit CAPTCHA ────────────────────────────────────────────
  const submitCaptcha = useCallback(
    async (data: SubmitCaptchaData): Promise<PortalSession | null> => {
      return run(() =>
        apiFetch<PortalSession>('portal-login', data)
      )
    },
    [run]
  )

  // ── 6. Datos de cuenta del portal ────────────────────────────────
  const getAccountData = useCallback(
    async (session: SessionState): Promise<AccountData | null> => {
      return run(() =>
        apiFetch<AccountData>('account', {
          username: session.username,
          cookies:  session.cookies,
        })
      )
    },
    [run]
  )

  // ── 7. Recarga ───────────────────────────────────────────────────
  const recharge = useCallback(
    async (session: SessionState, code: string): Promise<string | null> => {
      return run(async () => {
        const data = await apiFetch<{ message: string }>('recharge', {
          username:     session.username,
          password:     '',
          rechargeCode: code,
          cookies:      session.cookies,
        })
        return data.message
      })
    },
    [run]
  )

  // ── 8. Transferencia ─────────────────────────────────────────────
  const transfer = useCallback(
    async (
      session: SessionState,
      target:  string,
      amount:  number
    ): Promise<string | null> => {
      return run(async () => {
        const data = await apiFetch<{ message: string }>('transfer', {
          username:      session.username,
          password:      '',
          targetAccount: target,
          amount,
          cookies:       session.cookies,
        })
        return data.message
      })
    },
    [run]
  )

  // ── 9. Cambio de contraseña ──────────────────────────────────────
  const changePassword = useCallback(
    async (
      session:  SessionState,
      oldPw:    string,
      newPw:    string,
      type:     'account' | 'email'
    ): Promise<string | null> => {
      return run(async () => {
        const data = await apiFetch<{ message: string }>('password', {
          username:    session.username,
          oldPassword: oldPw,
          newPassword: newPw,
          type,
          cookies:     session.cookies,
        })
        return data.message
      })
    },
    [run]
  )

  // ── 10. Historial ────────────────────────────────────────────────
  const getHistory = useCallback(
    async (session: SessionState, type: HistoryType): Promise<HistoryData | null> => {
      return run(async () => {
        const data = await apiFetch<{ history: HistoryData }>('history', {
          username: session.username,
          password: '',
          type,
          cookies:  session.cookies,
        })
        return data.history
      })
    },
    [run]
  )

  const clearError = useCallback(() => {
    setError(null)
    setStatus('idle')
  }, [])

  return {
    status,
    error,
    remainingTime,
    remainingSeconds,
    initAndLogin,
    logout,
    fetchRemainingTime,
    getCaptcha,
    submitCaptcha,
    getAccountData,
    recharge,
    transfer,
    changePassword,
    getHistory,
    clearError,
  }
}