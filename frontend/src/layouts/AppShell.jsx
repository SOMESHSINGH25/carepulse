import {
  LayoutDashboard,
  LogOut,
  MessageSquareHeart,
  ShieldCheck,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { auth } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Feedback', to: '/feedback', icon: MessageSquareHeart },
]

export function AppShell() {
  const { user } = useAuth()
  const [logoutError, setLogoutError] = useState('')

  async function handleSignOut() {
    setLogoutError('')
    try {
      await signOut(auth)
    } catch {
      setLogoutError('Could not sign out. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-r lg:border-b-0">
        <div className="flex h-[76px] items-center px-5 lg:px-7">
          <BrandMark />
        </div>
        <div className="px-4 pb-4 lg:px-5 lg:pt-5">
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          <nav aria-label="Main navigation" className="flex gap-2 lg:flex-col">
            {navigation.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon aria-hidden="true" size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto hidden border-t border-slate-100 p-5 lg:block">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            <ShieldCheck aria-hidden="true" className="text-teal-700" size={16} />
            Secure care workspace
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div>
            <p className="text-xs font-medium text-slate-400">Care quality</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              Home care operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {logoutError && (
              <span className="hidden text-xs text-rose-700 md:inline" role="alert">
                {logoutError}
              </span>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-700">
                {user?.displayName || user?.email || 'Care team member'}
              </p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
              {(user?.displayName || user?.email || 'C').charAt(0).toUpperCase()}
            </span>
            <button
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              onClick={handleSignOut}
              title="Sign out"
              type="button"
            >
              <LogOut aria-hidden="true" size={18} />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
