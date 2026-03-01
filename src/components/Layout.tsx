import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'

// ── Theme toggle icons (inline SVG — no icon library dependency) ──
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function Layout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)            // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false) // mobile menu
  const menuRef = useRef<HTMLDivElement>(null)

  // Close desktop dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setOpen(false)
      setMobileOpen(false)
      navigate('/')
    }
  }

  // Toggle theme and close mobile menu
  function handleMobileThemeToggle() {
    toggleTheme()
    setMobileOpen(false)
  }

  const initial = user?.email?.[0].toUpperCase() ?? '?'
  const isAdmin = user?.user_metadata?.is_admin === true
  const isVerified = user?.user_metadata?.verified === true

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col">
      {/* ── Nav bar ─────────────────────────────────────────── */}
      <nav className="bg-bg-primary border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-brand shrink-0">
            Eventis
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-text-secondary hover:text-brand transition-colors">
              Renginiai
            </Link>
            <Link to="/sell" className="text-text-secondary hover:text-brand transition-colors">
              Parduoti
            </Link>
            <Link to="/naujienos" className="text-text-secondary hover:text-brand transition-colors">
              Naujienos
            </Link>
          </div>

          {/* Right side — hidden during auth initialisation to prevent flash */}
          {!loading && (
            <div className="flex items-center gap-3">
              {/* ── Theme toggle (desktop only) ── */}
              <button
                onClick={toggleTheme}
                aria-label="Perjungti temą"
                title="Perjungti temą"
                className="hidden sm:flex p-2 rounded-md text-text-muted hover:text-brand transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>

              {user ? (
                /* ── Logged-in: avatar + dropdown (desktop only) ── */
                <div className="relative hidden sm:block" ref={menuRef}>
                  <button
                    onClick={() => setOpen((o) => !o)}
                    aria-label="Paskyros meniu"
                    className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-text-on-brand text-sm font-bold hover:bg-brand-hover transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                  >
                    {initial}
                  </button>

                  {open && (
                    <div className="absolute right-0 top-10 z-50 min-w-[200px] bg-bg-primary rounded-xl shadow-lg border border-border py-1 text-sm">
                      <div className="px-4 py-2 text-xs text-text-muted truncate cursor-default">
                        {user.email}
                      </div>

                      <hr className="border-border my-1" />

                      <Link to="/profile"      onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Profilis</Link>
                      <Link to="/sell"         onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Parduoti bilietus</Link>
                      <Link to="/my-listings"  onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Mano skelbimai</Link>
                      <Link to="/my-orders"    onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Mano užsakymai</Link>
                      <Link to="/my-earnings"  onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Mano pajamos</Link>

                      {isAdmin && (
                        <>
                          <hr className="border-border my-1" />
                          <Link to="/admin/payouts"  onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Išmokos</Link>
                          <Link to="/admin/listings" onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Skelbimai</Link>
                          <Link to="/admin/users"    onClick={() => setOpen(false)} className="block px-4 py-2 text-text-secondary hover:bg-bg-surface">Vartotojai</Link>
                        </>
                      )}

                      {!isVerified && (
                        <>
                          <hr className="border-border my-1" />
                          <Link to="/verify" onClick={() => setOpen(false)} className="block px-4 py-2 text-warning hover:bg-warning-bg">
                            Patvirtinti tapatybę
                          </Link>
                        </>
                      )}

                      <hr className="border-border my-1" />
                      <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-text-muted hover:bg-bg-surface">
                        Atsijungti
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Logged-out: auth buttons (desktop only) ── */
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <Link to="/login" className="text-text-secondary hover:text-brand font-medium transition-colors">
                    Prisijungti
                  </Link>
                  <Link to="/register" className="px-4 py-1.5 bg-brand text-text-on-brand rounded-lg hover:bg-brand-hover font-medium transition-colors">
                    Registruotis
                  </Link>
                </div>
              )}

              {/* ── Hamburger (mobile only) ── */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                aria-label={mobileOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'}
                className="sm:hidden p-2 text-text-secondary hover:text-brand transition-colors focus:outline-none"
              >
                {mobileOpen ? '✕' : '☰'}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile menu overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 z-40 bg-bg-primary border-b border-border shadow-md sm:hidden">
          <div className="px-4 py-3 space-y-1 text-sm">
            {/* Public links */}
            <Link to="/"          onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary font-medium">Renginiai</Link>
            <Link to="/sell"      onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary font-medium">Parduoti bilietą</Link>
            <Link to="/naujienos" onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary font-medium">Naujienos</Link>

            {user ? (
              <>
                <hr className="border-border my-2" />
                <Link to="/profile"     onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Profilis</Link>
                <Link to="/my-listings" onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Mano skelbimai</Link>
                <Link to="/my-orders"   onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Mano užsakymai</Link>
                <Link to="/my-earnings" onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Mano pajamos</Link>

                {isAdmin && (
                  <>
                    <hr className="border-border my-2" />
                    <Link to="/admin/payouts"  onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Išmokos</Link>
                    <Link to="/admin/listings" onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Skelbimai</Link>
                    <Link to="/admin/users"    onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary">Vartotojai</Link>
                  </>
                )}

                {!isVerified && (
                  <Link to="/verify" onClick={() => setMobileOpen(false)} className="block py-2 text-warning">
                    Patvirtinti tapatybę
                  </Link>
                )}

                <hr className="border-border my-2" />

                {/* ── Dark mode toggle row ── */}
                <button
                  onClick={handleMobileThemeToggle}
                  className="flex w-full items-center justify-between py-2 text-text-secondary"
                >
                  <span>Tamsi tema</span>
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>

                <hr className="border-border my-2" />
                <button onClick={handleSignOut} className="block w-full text-left py-2 text-text-muted">
                  Atsijungti
                </button>
              </>
            ) : (
              <>
                <hr className="border-border my-2" />
                <Link to="/login"    onClick={() => setMobileOpen(false)} className="block py-2 text-text-secondary font-medium">Prisijungti</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block py-2 text-brand font-medium">Registruotis</Link>

                <hr className="border-border my-2" />

                {/* ── Dark mode toggle row (logged-out state) ── */}
                <button
                  onClick={handleMobileThemeToggle}
                  className="flex w-full items-center justify-between py-2 text-text-secondary"
                >
                  <span>Tamsi tema</span>
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Page content ─────────────────────────────────────── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <p className="text-lg font-bold text-brand">Eventis</p>
              <p className="text-sm text-text-muted mt-2">Saugi antrinė bilietų rinka Lietuvoje.</p>
            </div>

            {/* Platform links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Platforma</p>
              <Link to="/"          className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Renginiai</Link>
              <Link to="/sell"      className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Parduoti bilietą</Link>
              <Link to="/naujienos" className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Naujienos</Link>
            </div>

            {/* Info links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Informacija</p>
              <Link to="/apie"       className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Apie mus</Link>
              <Link to="/privatumas" className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Privatumo politika</Link>
              <Link to="/salygos"    className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Naudojimo sąlygos</Link>
              <Link to="/kontaktai"  className="block text-sm text-text-secondary hover:text-brand mb-2 transition-colors">Kontaktai</Link>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-6 text-xs text-text-muted text-center">
            © 2026 Eventis. Visos teisės saugomos.
          </div>
        </div>
      </footer>
    </div>
  )
}
