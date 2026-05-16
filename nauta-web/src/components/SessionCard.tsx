'use client'

import { Wifi, MapPin, Clock, Calendar, Shield, History } from 'lucide-react'
import type { SessionState } from '@/app/page'
import clsx from 'clsx'

interface Props {
  session:       SessionState
  remainingTime: string | null
}

export default function SessionCard({ session, remainingTime }: Props) {
  const { userInfo } = session

  const stats = [
    {
      label: 'IP del dispositivo',
      value: session.wlanuserip || '—',
      icon:  <MapPin size={13} />,
      mono:  true,
    },
    {
      label: 'Tiempo restante',
      value: remainingTime ?? userInfo?.credit ?? '—',
      icon:  <Clock size={13} />,
      accent: true,
    },
    {
      label: 'Estado de cuenta',
      value: userInfo?.account_state ?? '—',
      icon:  <Shield size={13} />,
    },
    {
      label: 'Vence el',
      value: userInfo?.expiration_date ?? '—',
      icon:  <Calendar size={13} />,
    },
    {
      label: 'Zonas de acceso',
      value: userInfo?.access_areas ?? '—',
      icon:  <Wifi size={13} />,
    },
  ]

  return (
    <div className="space-y-4 animate-slide-up">

      {/* Stats de sesión */}
      <div className="card-glow space-y-4">
        <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
          <Wifi size={15} className="text-nauta-accent" />
          Sesión activa
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{ background: '#090e12', border: '1px solid #1a2e3d' }}
            >
              <div className="flex items-center gap-2 text-nauta-muted">
                {stat.icon}
                <span className="text-xs font-mono">{stat.label}</span>
              </div>
              <span className={clsx(
                'text-sm font-mono font-medium',
                stat.accent ? 'text-nauta-accent text-glow' : 'text-nauta-text',
              )}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sesiones recientes */}
      {userInfo?.sessions && userInfo.sessions.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <History size={15} className="text-nauta-muted" />
            Sesiones recientes
          </h2>

          <div className="space-y-2">
            {userInfo.sessions.slice(0, 5).map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-2 text-xs font-mono py-2 border-b border-nauta-border last:border-0"
              >
                <span className="text-nauta-muted truncate">{s.start}</span>
                <span className="text-nauta-muted truncate text-center">{s.end}</span>
                <span className="text-nauta-accent text-right">{s.duration}</span>
              </div>
            ))}
          </div>

          {/* Header de columnas */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-nauta-muted/50 -mt-1">
            <span>Inicio</span>
            <span className="text-center">Fin</span>
            <span className="text-right">Duración</span>
          </div>
        </div>
      )}

      {/* Sin sesiones */}
      {(!userInfo?.sessions || userInfo.sessions.length === 0) && (
        <div className="card text-center py-8">
          <History size={24} className="text-nauta-muted mx-auto mb-2" />
          <p className="text-nauta-muted text-sm font-mono">
            No hay sesiones recientes registradas.
          </p>
        </div>
      )}
    </div>
  )
}