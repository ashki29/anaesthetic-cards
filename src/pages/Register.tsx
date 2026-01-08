import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'register' | 'team'>('register')
  const { signUp, joinTeam, createTeam } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, displayName)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setStep('team')
      setLoading(false)
    }
  }

  const handleJoinTeam = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await joinTeam(inviteCode)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  const handleCreateTeam = async () => {
    setError('')
    setLoading(true)

    const teamName = prompt('Enter your team name (e.g., "Royal Brompton Cardiac"):')
    if (!teamName) {
      setLoading(false)
      return
    }

    const { error, inviteCode } = await createTeam(teamName)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      alert(`Team created! Your invite code is: ${inviteCode}\n\nShare this code with your colleagues.`)
      navigate('/dashboard')
    }
  }

  if (step === 'team') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Welcome!</h1>
            <p className="text-slate-600 mt-2">
              Join your team or create a new one
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Join a Team</h2>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="label">Team Invite Code</label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="input font-mono text-center text-lg tracking-widest"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Get this code from your team lead
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? 'Joining...' : 'Join Team'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or</span>
              </div>
            </div>

            <button
              onClick={handleCreateTeam}
              disabled={loading}
              className="btn btn-secondary w-full"
            >
              Create New Team
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">AnaesCards</h1>
          <p className="text-slate-600 mt-2">
            Create your account
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Register</h2>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="label">Your Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input"
                placeholder="e.g., Sarah Jones"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                minLength={6}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-slate-500 mt-1">
                At least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
