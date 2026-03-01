import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface AdminUser {
  id: string
  email: string
  created_at: string
  banned_until: string | null
  is_admin: boolean
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Per-row action state
  const [actioning, setActioning] = useState<string | null>(null)
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user?.user_metadata?.is_admin) return
    load()
  }, [user])

  async function load() {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      method: 'GET',
    })

    if (error) {
      setError(error.message)
    } else {
      setUsers((data as AdminUser[]) ?? [])
    }
    setLoading(false)
  }

  async function handleAction(userId: string, action: 'suspend' | 'unsuspend') {
    setActioning(userId)
    setActionErrors((prev) => { const next = { ...prev }; delete next[userId]; return next })

    const { error } = await supabase.functions.invoke('admin-users', {
      method: 'POST',
      body: { action, userId },
    })

    if (error) {
      setActionErrors((prev) => ({ ...prev, [userId]: error.message }))
    } else {
      await load()
    }
    setActioning(null)
  }

  // Redirect non-admins after auth resolves
  if (!authLoading && !user?.user_metadata?.is_admin) {
    return <Navigate to="/" replace />
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-gray-500">Kraunama...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <p className="text-red-500">Klaida: {error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin — Vartotojai</h1>

      {users.length === 0 ? (
        <p className="text-gray-500">Nėra vartotojų.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const isBanned = !!u.banned_until
            const createdDate = new Date(u.created_at).toLocaleDateString('lt-LT')
            const isActioning = actioning === u.id

            return (
              <li
                key={u.id}
                className="bg-white rounded-xl border border-gray-200 px-5 py-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{u.email}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Registruotas: {createdDate}
                      {u.is_admin && (
                        <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Status + action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {isBanned ? 'Sustabdytas' : 'Aktyvus'}
                    </span>

                    {/* Don't allow suspending yourself or other admins */}
                    {!u.is_admin && u.id !== user?.id && (
                      <button
                        onClick={() => handleAction(u.id, isBanned ? 'unsuspend' : 'suspend')}
                        disabled={isActioning}
                        className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                          isBanned
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {isActioning
                          ? 'Vykdoma...'
                          : isBanned ? 'Atblokuoti' : 'Sustabdyti'}
                      </button>
                    )}
                  </div>
                </div>

                {actionErrors[u.id] && (
                  <p className="mt-2 text-sm text-red-600">{actionErrors[u.id]}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
