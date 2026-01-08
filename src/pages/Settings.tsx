import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { profile, team, signOut } = useAuth()
  const [showInviteCode, setShowInviteCode] = useState(false)

  if (!profile || !team) {
    return null
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Profile */}
      <div className="card mb-4">
        <h2 className="font-semibold mb-4">Your Profile</h2>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-slate-500">Name:</span>
            <span className="ml-2">{profile.display_name}</span>
          </div>
          <div>
            <span className="text-sm text-slate-500">Email:</span>
            <span className="ml-2">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="card mb-4">
        <h2 className="font-semibold mb-4">Your Team</h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-slate-500">Team Name:</span>
            <span className="ml-2">{team.name}</span>
          </div>
          <div>
            <span className="text-sm text-slate-500">Invite Code:</span>
            {showInviteCode ? (
              <span className="ml-2 font-mono bg-slate-100 px-2 py-1 rounded">
                {team.invite_code}
              </span>
            ) : (
              <button
                onClick={() => setShowInviteCode(true)}
                className="ml-2 text-blue-600 hover:underline text-sm"
              >
                Show code
              </button>
            )}
          </div>
          {showInviteCode && (
            <p className="text-sm text-slate-500">
              Share this code with colleagues to invite them to your team.
            </p>
          )}
        </div>
      </div>

      {/* Sign out */}
      <div className="card">
        <h2 className="font-semibold mb-4">Account</h2>
        <button
          onClick={signOut}
          className="btn btn-secondary text-red-600"
        >
          Sign Out
        </button>
      </div>

      {/* App info */}
      <div className="mt-8 text-center text-sm text-slate-400">
        <p>AnaesCards v1.0</p>
        <p>Collaborative anaesthetic preference cards</p>
      </div>
    </div>
  )
}
