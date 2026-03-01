import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

// Only allow relative paths — blocks open redirect attacks
function safeReturnUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/')) return '/'
  return raw
}

// Map known Supabase English signup error messages to Lithuanian
function localiseError(msg: string): string {
  if (msg.includes('User already registered'))               return 'Toks el. pašto adresas jau užregistruotas.'
  if (msg.includes('Password should be at least'))           return 'Slaptažodis per trumpas (min. 6 simboliai).'
  return 'Registracija nepavyko. Bandykite dar kartą.'
}

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Slaptažodžiai nesutampa.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      setError(localiseError(error.message))
      return
    }

    if (!data.session) {
      // Supabase requires email confirmation — session is not active yet
      setConfirmationSent(true)
      return
    }

    navigate(safeReturnUrl(returnUrl), { replace: true })
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login?returnUrl=${encodeURIComponent(safeReturnUrl(returnUrl))}`,
      },
    })
  }

  if (confirmationSent) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-3">Patikrinkite el. paštą</h1>
          <p className="text-text-muted text-sm mb-6">
            Išsiuntėme patvirtinimo nuorodą į <strong>{email}</strong>. Spustelėkite ją, kad
            aktyvuotumėte paskyrą.
          </p>
          <Link to="/login" className="text-brand hover:underline text-sm">
            Grįžti į prisijungimą
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Sukurti paskyrą</h1>

        {/* Google OAuth — shown first for new users (lowest friction path) */}
        <Button type="button" variant="secondary" onClick={handleGoogle} className="w-full">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Registruotis su Google
        </Button>

        <div className="flex items-center gap-3 my-4">
          <hr className="flex-1 border-border" />
          <span className="text-xs text-text-muted">arba</span>
          <hr className="flex-1 border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="El. paštas"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Slaptažodis"
            type="password"
            required
            minLength={6}
            helperText="min. 6 simboliai"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Pakartokite slaptažodį"
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          {error && <p className="text-sm text-danger-text">{error}</p>}

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Registruotis
          </Button>
        </form>

        <p className="mt-4 text-sm text-text-muted text-center">
          Jau turite paskyrą?{' '}
          <Link
            to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
            className="text-brand hover:underline"
          >
            Prisijungti
          </Link>
        </p>
      </div>
    </div>
  )
}
