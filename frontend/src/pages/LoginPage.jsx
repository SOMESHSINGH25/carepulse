import { signInWithEmailAndPassword } from 'firebase/auth'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { auth } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { firebaseConfigured, loading, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (signInError) {
      const messages = {
        'auth/invalid-credential': 'The email or password is incorrect.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Unable to reach Firebase. Check your connection.',
      }
      setError(
        messages[signInError.code] ||
          'Sign-in failed. Check your details and try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex h-[76px] items-center px-6 sm:px-10">
        <BrandMark />
      </header>
      <section className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <LockKeyhole aria-hidden="true" size={21} />
          </span>
          <p className="mt-6 text-sm font-semibold text-teal-800">Care team access</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Sign in to CarePulse
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Use your administrator account to review visit feedback and care
            quality.
          </p>
          {firebaseConfigured ? (
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>
              {error && (
                <p className="text-sm text-rose-700" role="alert">
                  {error}
                </p>
              )}
              <button
                className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <div
              className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              Firebase web settings are missing. Add them to frontend/.env and
              restart Vite.
            </div>
          )}
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-800"
            to="/feedback"
          >
            Visit the public feedback page
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </section>
      <footer className="px-6 py-5 text-center text-xs text-slate-400">
        CarePulse · Better care, informed by every visit
      </footer>
    </main>
  )
}
