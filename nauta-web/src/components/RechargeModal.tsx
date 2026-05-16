'use client'

import { useState } from 'react'
import { CreditCard, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useNauta } from '@/hooks/useNauta'
import type { SessionState } from '@/app/page'

interface Props {
  session:   SessionState
  onClose:   () => void
  onSuccess: (msg: string) => void
}

export default function RechargeModal({ session, onClose, onSuccess }: Props) {
  const [code,  setCode]  = useState('')
  const { recharge, status, error, clearError } = useNauta()
  const loading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const msg = await recharge(session, code.replace(/\s/g, ''))
    if (msg) onSuccess(msg)
  }

  // Formatear código en grupos de 4
  const handleCodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    const groups = digits.match(/.{1,4}/g) ?? []
    setCode(groups.join(' '))
  }

  const rawCode   = code.replace(/\s/g, '')
  const isValid   = rawCode.length >= 12 && rawCode.length <= 16

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card-glow w-full max-w-sm animate-slide-up space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-white flex items-center gap-2">
            <CreditCard size={16} className="text-nauta-accent2" />
            Recargar cuenta
          </h2>
          <button onClick={onClose} className="text-nauta-muted hover:text-nauta-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error animate-fade-in">
            <AlertCircle size={14} className="shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Input del código */}
          <div>
            <label className="label">Código de recarga</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              disabled={loading}
              className="input text-center font-mono text-lg tracking-widest"
              autoFocus
            />
            <p className="text-nauta-muted text-xs font-mono mt-1.5 text-center">
              {rawCode.length} / 12–16 dígitos
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-mono text-nauta-muted"
            style={{ background: '#090e12', border: '1px solid #1a2e3d' }}>
            <CheckCircle size={13} className="text-nauta-accent2 shrink-0 mt-0.5" />
            El saldo se acreditará inmediatamente en tu cuenta Nauta.
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={!isValid || loading} className="btn-primary flex-1">
              {loading
                ? <><Loader2 size={14} className="animate-spin" />Recargando…</>
                : <><CreditCard size={14} />Recargar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}