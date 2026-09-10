import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import App from './App'
import './signin.css'

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(false)
    })

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!active) return
        if (error) throw error

        setSession(data.session)
      } catch (error) {
        if (!active) return

        setMessage(
          error instanceof Error
            ? error.message
            : 'Could not restore your session. Please sign in again.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void restoreSession()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const form = event.currentTarget
    const fields = new FormData(form)
    const email = String(fields.get('email') ?? '').trim()
    const password = String(fields.get('password') ?? '')
    const confirmation = String(fields.get('confirmPassword') ?? '')

    setMessage('')

    if (mode === 'signup' && password !== confirmation) {
      setMessage('Passwords do not match.')
      return
    }

    setBusy(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        if (error) throw error

        if (data.session) {
          setSession(data.session)
        } else {
          setMessage(
            'Check your inbox and spam folder for a confirmation email. ' +
              'Open the confirmation link, then sign in. ' +
              'If you already have an account, use Sign in.',
          )
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        if (!data.session) throw new Error('No session was returned.')

        setSession(data.session)
      }

      form.reset()
      setShowPassword(false)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) throw error

      setSession(null)
      setMode('signin')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Logout failed. Try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="signin-content" role="status">
        <p>Checking your session…</p>
      </div>
    )
  }

  if (session) {
    return (
      <>
        <div className="demo-session">
          <span>
            Signed in as <strong>{session.user.email}</strong>
          </span>

          <button type="button" onClick={logout} disabled={busy}>
            {busy ? 'Signing out…' : 'Logout'}
          </button>
        </div>

        {message && (
          <p className="signin-notice" role="alert">
            {message}
          </p>
        )}

        <App key={session.user.id} userId={session.user.id} />
      </>
    )
  }

  return (
    <main className="signin-page">
      <section className="signin-form-side">
        <div className="signin-brand">
          <span aria-hidden="true">↗</span>
          <div>
            YatriFlow
            <small>Travel better. Spread the joy.</small>
          </div>
        </div>

        <div className="signin-content">
          <p className="signin-eyebrow">YOUR NEXT JOURNEY STARTS HERE</p>

          <h1>
            {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
          </h1>

          <p className="signin-description">
            {mode === 'signin'
              ? 'Sign in to continue your journey.'
              : 'Join YatriFlow with your email address.'}
          </p>

          <form
            key={mode}
            className="signin-form"
            onSubmit={handleSubmit}
            aria-busy={busy}
          >
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={busy}
            />

            <label htmlFor="auth-password">Password</label>
            <div className="signin-password-field">
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                placeholder={
                  mode === 'signup'
                    ? 'Create a password: at least 8 characters'
                    : 'Enter your password'
                }
                minLength={mode === 'signup' ? 8 : 1}
                required
                disabled={busy}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={busy}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {mode === 'signup' && (
              <>
                <label htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter the same password again"
                  minLength={8}
                  required
                  disabled={busy}
                />
              </>
            )}

            <button className="signin-submit" type="submit" disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in →'
                  : 'Create account →'}
            </button>

            {message && (
              <p className="signin-notice" role="alert">
                {message}
              </p>
            )}
          </form>

          <div className="signin-divider">
            <span>
              {mode === 'signin'
                ? 'NEW TO YATRIFLOW?'
                : 'ALREADY HAVE AN ACCOUNT?'}
            </span>
          </div>

          <button
            className="signin-demo"
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setMessage('')
              setShowPassword(false)
            }}
          >
            {mode === 'signin' ? 'Create an account' : 'Back to sign in'}
          </button>
        </div>

        <footer className="signin-footer">
          TEAM RAJMUDRA <span>YatriFlow</span>
        </footer>
      </section>

      <aside className="signin-story">
        <div className="signin-story-top">
          <span>EXPLORE A BALANCED INDIA</span>
          <span aria-hidden="true">↗</span>
        </div>

        <div className="signin-story-copy">
          <h2>
            Beyond the crowds.
            <br />
            Closer to the place.
          </h2>
          <p>Thoughtful travel starts with a better plan.</p>
        </div>

        <div
          className="hero-photo signin-scenery"
          role="img"
          aria-label="Mountain temple scenery"
        />

        <div className="signin-story-bottom">
          <span>Discover more.</span>
          <span>Travel thoughtfully.</span>
        </div>
      </aside>
    </main>
  )
}