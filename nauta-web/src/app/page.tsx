'use client'

import { useEffect, useState } from 'react'
import LoginPanel  from '@/components/LoginPanel'
import Dashboard   from '@/components/Dashboard'

export type AppView = 'login' | 'dashboard'

export type SessionState = {
  username:      string
  wlanuserip:    string
  csrfhw:        string
  attributeUuid: string
  cookies:       Record<string, string>
  loggedIn:      boolean
  userInfo: {
    account_state:   string
    credit:          string
    expiration_date: string
    access_areas:    string
    sessions:        { start: string; end: string; duration: string }[]
  } | null
}

const EMPTY_SESSION: SessionState = {
  username:      '',
  wlanuserip:    '',
  csrfhw:        '',
  attributeUuid: '',
  cookies:       {},
  loggedIn:      false,
  userInfo:      null,
}

export default function Home() {
  const [view,    setView]    = useState<AppView>('login')
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION)

  // Restaurar sesión guardada en localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nauta_session')
      if (saved) {
        const parsed: SessionState = JSON.parse(saved)
        if (parsed.loggedIn && parsed.username) {
          setSession(parsed)
          setView('dashboard')
        }
      }
    } catch {
      localStorage.removeItem('nauta_session')
    }
  }, [])

  const handleLoginSuccess = (newSession: SessionState) => {
    setSession(newSession)
    setView('dashboard')
    localStorage.setItem('nauta_session', JSON.stringify(newSession))
  }

  const handleLogout = () => {
    setSession(EMPTY_SESSION)
    setView('login')
    localStorage.removeItem('nauta_session')
  }

  const updateSession = (partial: Partial<SessionState>) => {
    setSession(prev => {
      const updated = { ...prev, ...partial }
      localStorage.setItem('nauta_session', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <main className="min-h-screen flex flex-col">
      {view === 'login' ? (
        <LoginPanel onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard
          session={session}
          onLogout={handleLogout}
          onUpdateSession={updateSession}
        />
      )}
    </main>
  )
}