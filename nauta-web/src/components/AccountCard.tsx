'use client'

import { useState } from 'react'
import {
  User, CreditCard, Calendar, Shield,
  Wifi, Mail, RefreshCw, Loader2, AlertCircle
} from 'lucide-react'
import { useNauta } from '@/hooks/useNauta'
import type { AccountData } from '@/hooks/useNauta'
import type { SessionState } from '@/app/page'
import clsx from 'clsx'

interface Props {
  session:   SessionState
  onSuccess: (msg: string, type?: 'success' | 'error') => void
}

export default function AccountCard({ session, onSuccess }: Props) {
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [loaded,      setLoaded]      = useState(false)
  const { getAccountData, status, error } = useNauta()

  const loading = status === 'loading'

  const handleLoad = async () => {
    const data = await getAccountData(session)
    if (data) {
      setAccountData(data)
      setLoaded(true)
    } else {
      onSuccess('No se pudo cargar la información del portal.', 'error')
    }
  }

  const fields: {
    label: string
    key:   keyof AccountData
    icon:  React.ReactNode
    accent?: boolean
    mono?:   boolean
  }[] = [
    { label: 'Usuario',            key: 'username',          icon: <User size={13} /> },
    { label: 'Saldo disponible',   key: 'available_balance', icon: <CreditCard size={13} />, accent: true },
    { label: 'Tiempo disponible',  key: 'remaining_time',    icon: <Wifi size={13} />,       accent: true },
    { label: 'Tipo de cuenta',     key: 'account_type',      icon: <Shield size={13} /> },
    { label: 'Tipo de servicio',   key: 'service_type',      icon: <Wifi size={13} /> },
    { label: 'Fecha de bloqueo',   key: 'blocking_date',     icon: <Calendar size={13} />,   mono: true },
    { label: 'Fecha de baja',      key: 'elimination_date',  icon: <Calendar size={13} />,   mono: true },
    { label: 'Correo asociado',    key: 'email_account',     icon: <Mail size={13} />,       mono: true },
  ]

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Header */}
      <div className="card-glow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <User size={15} className="text-nauta-accent" />
            Datos del portal
          </h2>

          <button
            onClick={handleLoad}
            disabled={loading}
            className="btn-secondary text-xs px-3 py-1.5 gap-1.5"
          >
            {loading
              ? <Loader2 size={12} className="animate-spin" />
              : <RefreshCw size={12} className={clsx(loaded && 'text-nauta-accent')} />
            }
            {loaded ? 'Actualizar' : 'Cargar datos'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error animate-fade-in">
            <AlertCircle size={14} className="shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        {/* Aviso: requiere portal */}
        {!loaded && !loading && !error && (
          <div className="alert-warning">
            <Shield size={14} className="shrink-0" />
            <span className="text-xs leading-snug">
              Esta sección usa el portal web de Nauta y puede requerir CAPTCHA
              si la sesión del portal no está activa.
            </span>
          </div>
        )}

        {/* Skeleton loader */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ background: '#090e12', border: '1px solid #1a2e3d' }}>
                <div className="h-3 w-24 bg-nauta-border rounded" />
                <div className="h-3 w-20 bg-nauta-border rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Datos cargados */}
        {loaded && accountData && !loading && (
          <div className="grid grid-cols-1 gap-3 animate-fade-in">
            {fields.map((field, i) => {
              const value = accountData[field.key] || '—'
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ background: '#090e12', border: '1px solid #1a2e3d' }}
                >
                  <div className="flex items-center gap-2 text-nauta-muted">
                    {field.icon}
                    <span className="text-xs font-mono">{field.label}</span>
                  </div>
                  <span className={clsx(
                    'text-sm font-medium max-w-[55%] text-right truncate',
                    field.mono   && 'font-mono',
                    field.accent ? 'text-nauta-accent text-glow' : 'text-nauta-text',
                  )}>
                    {value}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Nota al pie */}
      {loaded && (
        <p className="text-center text-nauta-muted/50 text-xs font-mono">
          Datos obtenidos de portal.nauta.cu
        </p>
      )}
    </div>
  )
}