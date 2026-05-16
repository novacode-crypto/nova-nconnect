'use client'

import { useState } from 'react'
import { Wifi, Eye, EyeOff, Loader2, AlertCircle, Globe } from 'lucide-react'
import { useNauta } from '@/hooks/useNauta'
import type { SessionState } from '@/app/page'
import clsx from 'clsx'

interface Props {
  onLoginSuccess: (session: SessionState) => void
}

export default function LoginPanel({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [domain,   setDomain]   = useState('@nauta.com.cu')

  const { initAndLogin, status, error, clearError } = useNauta()
  const loading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    const fullUsername = username.includes('@')
      ? username
      : `${username}${domain}`

    const session = await initAndLogin(fullUsername, password)
    if (session) onLoginSuccess(session)
  }

  const isValid = username.trim().length > 0 && password.trim().length > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4">

      {/* Panel central */}
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
            style={{ background: 'linear-gradient(135deg, #00d4ff22, #00ff9d11)', border: '1px solid #00d4ff33' }}>
            <Globe size={28} className="text-nauta-accent" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-nauta-accent2 animate-pulse-slow" />
          </div>

          <h1 className="text-2xl font-display font-bold text-white tracking-tight">
            Nauta<span className="text-nauta-accent">Web</span>
          </h1>
          <p className="text-nauta-muted text-sm mt-1 font-mono">
            portal.etecsa.net · gestión de cuenta
          </p>
        </div>

        {/* Card */}
        <div className="card-glow">

          {/* Error */}
          {error && (
            <div className="alert-error mb-5 animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span className="text-xs leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Usuario */}
            <div>
              <label className="label">Usuario</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="nombre.usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  className={clsx(
                    'input flex-1',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                />
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  disabled={loading}
                  className={clsx(
                    'input w-auto text-xs px-2 cursor-pointer',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <option value="@nauta.com.cu">@nauta.com.cu</option>
                  <option value="@nauta.co.cu">@nauta.co.cu</option>
                </select>
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className={clsx(
                    'input pr-10',
                    loading && 'opacity-50 cursor-not-allowed'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nauta-muted hover:text-nauta-accent transition-colors"
                  tabIndex={-1}
                >
                  {showPass
                    ? <EyeOff size={15} />
                    : <Eye size={15} />
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Conectando…
                </>
              ) : (
                <>
                  <Wifi size={15} />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="divider" />
          <p className="text-center text-nauta-muted text-xs font-mono leading-relaxed">
            Tus credenciales solo se usan para<br />
            conectar con los servidores de ETECSA.
          </p>
        </div>

        {/* Versión */}
        <p className="text-center text-nauta-muted/40 text-xs font-mono mt-6">
          NautaWeb v1.0 · stickNAUTA port
        </p>
      </div>
    </div>
  )
}