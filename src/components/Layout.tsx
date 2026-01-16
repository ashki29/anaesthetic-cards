import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children?: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, team, signOut, loading, initError, refreshProfile } = useAuth()
  const location = useLocation()
  const [signingOut, setSigningOut] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">
          <div>Loading...</div>
          {initError && (
            <div className="mt-2 text-sm text-red-600 max-w-md">
              {initError}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-red-600 break-words">{initError}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload
            </button>
            <button
              onClick={async () => {
                try {
                  setSigningOut(true)
                  await signOut()
                } finally {
                  setSigningOut(false)
                }
              }}
              disabled={signingOut}
              className="btn btn-secondary"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // User is authenticated, but profile/team may still be loading or missing.
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center text-slate-600">
          <div className="text-slate-900 font-semibold">Loading your account…</div>
          <p className="mt-2 text-sm">If this doesn't resolve, try reloading or signing out.</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => refreshProfile()}
              className="btn btn-primary"
            >
              Retry
            </button>
            <button
              onClick={async () => {
                try {
                  setSigningOut(true)
                  await signOut()
                } finally {
                  setSigningOut(false)
                }
              }}
              disabled={signingOut}
              className="btn btn-secondary"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile.team_id) {
    return <Navigate to="/register" state={{ from: location }} replace />
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center text-slate-600">
          <div className="text-slate-900 font-semibold">Loading your team…</div>
          <p className="mt-2 text-sm">If this doesn't resolve, try reloading.</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => refreshProfile()}
              className="btn btn-primary"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="font-bold text-xl text-blue-600">
              AnaesCards
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                {team.name}
              </span>
              <button
                onClick={async () => {
                  try {
                    setSigningOut(true)
                    await signOut()
                  } finally {
                    setSigningOut(false)
                  }
                }}
                disabled={signingOut}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {children || <Outlet />}
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="bg-white border-t border-slate-200 sticky bottom-0 sm:hidden">
        <div className="flex justify-around py-2">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center px-3 py-2 text-xs ${
              isActive('/dashboard') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Link>
          <Link
            to="/notices"
            className={`flex flex-col items-center px-3 py-2 text-xs ${
              isActive('/notices') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Notices
          </Link>
          <Link
            to="/consultants"
            className={`flex flex-col items-center px-3 py-2 text-xs ${
              location.pathname.startsWith('/consultant') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Consultants
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center px-3 py-2 text-xs ${
              isActive('/settings') ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      </nav>
    </div>
  )
}
