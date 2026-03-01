import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

// Only allow relative paths — blocks open redirect attacks like ?returnUrl=https://evil.com
function safeReturnUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/')) return '/'
  return raw
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Map known Supabase English error messages to Lithuanian
  function localiseError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Neteisingas el. paštas arba slaptažodis.'
    if (msg.includes('Email not confirmed'))       return 'Patvirtinkite el. paštą prieš prisijungiant.'
    if (msg.includes('Too many requests'))         return 'Per daug bandymų. Pabandykite vėliau.'
    return msg
  }

  // On mount: if a session already exists (e.g. returning from Google OAuth),
  // skip the login form and navigate to the intended destination immediately.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate(safeReturnUrl(returnUrl), { replace: true })
      }
    })
  }, [navigate, returnUrl])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(localiseError(error.message))
      return
    }

    navigate(safeReturnUrl(returnUrl), { replace: true })
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Pass returnUrl through the OAuth round-trip via redirectTo query param
        redirectTo: `${window.location.origin}/login?returnUrl=${encodeURIComponent(safeReturnUrl(returnUrl))}`,
      },
    })
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-sm">
        {/* Context banner — shown when user was redirected here mid-flow (e.g. buy attempt) */}
        {returnUrl && (
          <div className="mb-4 px-4 py-2.5 bg-brand-subtle border border-brand-border rounded-lg text-sm text-brand">
            Prisijunkite, kad galėtumėte tęsti
          </div>
        )}

        <h1 className="text-2xl font-bold text-text-primary mb-6">Prisijungti</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="El. paštas"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password row: label + "Pamiršote?" link side by side */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                Slaptažodis
              </label>
              <a href="/reset-password" className="text-xs text-text-muted hover:text-brand">
                Pamiršote?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-danger-text">{error}</p>}

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Prisijungti
          </Button>
        </form>

        {/* Social auth divider */}
        <div className="flex items-center gap-3 my-4">
          <hr className="flex-1 border-border" />
          <span className="text-xs text-text-muted">arba</span>
          <hr className="flex-1 border-border" />
        </div>

        {/* Google OAuth button */}
        <Button type="button" variant="secondary" onClick={handleGoogle} className="w-full">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Prisijungti su Google
        </Button>

        <p className="mt-4 text-sm text-text-muted text-center">
          Neturite paskyros?{' '}
          <Link
            to={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
            className="text-brand hover:underline"
          >
            Registruotis
          </Link>
        </p>
      </div>
    </div>
  )
}
