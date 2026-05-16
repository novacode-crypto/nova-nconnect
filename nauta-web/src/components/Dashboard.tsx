'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wifi, WifiOff, Clock, CreditCard, History,
  ArrowLeftRight, KeyRound, LogOut, RefreshCw,
  User, ChevronRight, Loader2
} from 'lucide-react'
import { useNauta } from '@/hooks/useNauta'
import type { SessionState } from '@/app/page'
import SessionCard   from './SessionCard'
import AccountCard   from './AccountCard'
import RechargeModal from './RechargeModal'
import TransferModal from './TransferModal'
import PasswordModal from './PasswordModal'
import HistoryTable  from './HistoryTable'
import clsx from 'clsx'

type Panel = 'session' | 'account' | 'history'
type Modal = 'recharge' | 'transfer' | 'password' | null

interface Props {
  session:         SessionState
  onLogout:        () => void
  onUpdateSession: (partial: Partial<SessionState>) => void
}

export default function Dashboard({ session, onLogout, onUpdateSession }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>('session')
  const [activeModal, setActiveModal] = useState<Modal>(null)
  const [logingOut,   setLogingOut]   = useState(false)
  const [toast,       setToast]       = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const { logout, fetchRemainingTime, remainingTime, remainingSeconds, status } = useNauta()

  // Polling del tiempo restante cada 30s
  useEffect(() => {
    if (!session.loggedIn) return
    fetchRemainingTime(session)
    const interval = setInterval(() => fetchRemainingTime(session), 30_000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loggedIn])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const handleLogout = async () => {
    setLogingOut(true)
    await logout(session)
    setLogingOut(false)
    onLogout()
  }

  const navItems: { id: Panel; label: string; icon: React.ReactNode }[] = [
    { id: 'session', label: 'Sesión',   icon: <Wifi size={15} /> },
    { id: 'account', label: 'Cuenta',   icon: <User size={15} /> },
    { id: 'history', label: 'Historial', icon: <History size={15} /> },
  ]

  const actions = [
    { id: 'recharge', label: 'Recargar',     icon: <CreditCard size={14} />,    color: 'text-nauta-accent2' },
    { id: 'transfer', label: 'Transferir',   icon: <ArrowLeftRight size={14} />, color: 'text-nauta-accent' },
    { id: 'password', label: 'Contraseña',   icon: <KeyRound size={14} />,      color: 'text-nauta-warning' },
  ] as const

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-4 py-6 gap-4 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-lg leading-tight">
            Nauta<span className="text-nauta-accent">Web</span>
          </h1>
          <p className="text-nauta-muted text-xs font-mono truncate max-w-[200px]">
            {session.username}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador de estado */}
          <div className={clsx(
            'badge',
            session.loggedIn ? 'badge-online' : 'badge-offline'
          )}>
            {session.loggedIn
              ? <><span className="w-1.5 h-1.5 rounded-full bg-nauta-accent2 animate-pulse" />Online</>
              : <><WifiOff size={11} />Offline</>
            }
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={logingOut}
            className="btn-danger text-xs px-3 py-2"
          >
            {logingOut
              ? <Loader2 size={13} className="animate-spin" />
              : <LogOut size={13} />
            }
            {logingOut ? 'Saliendo…' : 'Salir'}
          </button>
        </div>
      </header>

      {/* ── Tiempo restante (hero) ──────────────────────────────── */}
      <div className="card-glow text-center py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-glow-radial opacity-50 pointer-events-none" />
        <p className="stat-label mb-1">Tiempo restante</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-4xl font-display font-bold text-nauta-accent text-glow tracking-tight">
            {remainingTime ?? session.userInfo?.credit ?? '—'}
          </p>
          <button
            onClick={() => fetchRemainingTime(session)}
            disabled={status === 'loading'}
            className="text-nauta-muted hover:text-nauta-accent transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={15} className={clsx(status === 'loading' && 'animate-spin')} />
          </button>
        </div>
        {remainingSeconds !== null && (
          <p className="text-nauta-muted text-xs font-mono mt-1">
            {remainingSeconds.toLocaleString()} segundos
          </p>
        )}
      </div>

      {/* ── Acciones rápidas ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => setActiveModal(action.id)}
            className="card flex flex-col items-center gap-2 py-4 hover:border-nauta-accent/40
                       transition-all duration-200 hover:scale-[1.02] active:scale-95 group"
          >
            <span className={clsx('transition-colors', action.color, 'group-hover:scale-110 transition-transform')}>
              {action.icon}
            </span>
            <span className="text-xs font-mono text-nauta-muted group-hover:text-nauta-text transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Navegación de paneles ────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl"
        style={{ background: '#0f1923', border: '1px solid #1a2e3d' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActivePanel(item.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-mono transition-all duration-200',
              activePanel === item.id
                ? 'bg-nauta-accent text-nauta-bg font-medium'
                : 'text-nauta-muted hover:text-nauta-text'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Panel activo ─────────────────────────────────────────── */}
      <div className="flex-1 animate-fade-in" key={activePanel}>
        {activePanel === 'session' && (
          <SessionCard session={session} remainingTime={remainingTime} />
        )}
        {activePanel === 'account' && (
          <AccountCard session={session} onSuccess={showToast} />
        )}
        {activePanel === 'history' && (
          <HistoryTable session={session} onSuccess={showToast} />
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────── */}
      {activeModal === 'recharge' && (
        <RechargeModal
          session={session}
          onClose={() => setActiveModal(null)}
          onSuccess={msg => { setActiveModal(null); showToast(msg) }}
        />
      )}
      {activeModal === 'transfer' && (
        <TransferModal
          session={session}
          onClose={() => setActiveModal(null)}
          onSuccess={msg => { setActiveModal(null); showToast(msg) }}
        />
      )}
      {activeModal === 'password' && (
        <PasswordModal
          session={session}
          onClose={() => setActiveModal(null)}
          onSuccess={msg => { setActiveModal(null); showToast(msg) }}
        />
      )}

      {/* ── Toast de notificaciones ──────────────────────────────── */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up',
          'px-5 py-3 rounded-xl text-sm font-mono shadow-nauta-lg',
          'flex items-center gap-2 max-w-xs text-center',
          toast.type === 'success' ? 'alert-success' : 'alert-error'
        )}>
          {toast.type === 'success'
            ? <ChevronRight size={14} className="shrink-0" />
            : <span className="shrink-0">✕</span>
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}