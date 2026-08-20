import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Sidebar() {
  const { user } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg transition ${
      isActive
        ? 'bg-blue-600 text-white font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">WAGI Admin</h1>

        <div className="text-sm text-gray-600 mt-1">
          {user?.email}
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink to="/" className={linkClass}>
          Dashboard
        </NavLink>

        <NavLink to="/products" className={linkClass}>
          Products
        </NavLink>

        <NavLink to="/orders" className={linkClass}>
          Orders
        </NavLink>

        <NavLink to="/customers" className={linkClass}>
          Customers
        </NavLink>

        <NavLink to="/reports" className={linkClass}>
          Reports
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          Settings
        </NavLink>
      </nav>
    </aside>
  )
}