import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth'
import api from '../api'

type NotificationItem = {
  id: number
  title?: string
  message?: string
  type?: string
  read_at?: string | null
  created_at?: string
}

export default function Header() {
  const { user, logout } = useAuth()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState('')

  const notificationRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      setNotificationError('')

      const response = await api.get('/api/admin/notifications')

      const data = response.data

      if (Array.isArray(data)) {
        setNotifications(data)
      } else if (Array.isArray(data?.data)) {
        setNotifications(data.data)
      } else {
        setNotifications([])
      }
    } catch (error: any) {
      console.error('Could not load notifications:', error)

      setNotificationError(
        error?.response?.data?.message ||
          'Could not load notifications.'
      )
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleNotificationClick = async () => {
    const nextState = !showNotifications

    setShowNotifications(nextState)

    if (nextState) {
      await fetchNotifications()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const formatDate = (date?: string) => {
    if (!date) return ''

    try {
      return new Date(date).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return ''
    }
  }

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">

      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
          🛒
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            WAGI - STATIONARIES
          </h1>

          <p className="text-xs text-slate-500">
            Admin Dashboard
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-5">

        {/* Notifications */}
        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={handleNotificationClick}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="relative w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-xl transition"
          >
            🔔

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-96 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Notifications
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    WAGI Stationeries updates
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-blue-600">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="max-h-96 overflow-y-auto">

                {loadingNotifications && (
                  <div className="p-6 text-center text-sm text-slate-500">
                    Loading notifications...
                  </div>
                )}

                {!loadingNotifications && notificationError && (
                  <div className="p-5 text-sm text-red-600 bg-red-50">
                    {notificationError}
                  </div>
                )}

                {!loadingNotifications &&
                  !notificationError &&
                  notifications.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="text-3xl mb-3">
                        🔔
                      </div>

                      <p className="font-semibold text-slate-800">
                        No notifications
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        You're all caught up.
                      </p>
                    </div>
                  )}

                {!loadingNotifications &&
                  !notificationError &&
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition ${
                        !notification.read_at
                          ? 'bg-blue-50/50'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex gap-3">

                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          🔔
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-slate-900">
                              {notification.title || 'Notification'}
                            </h4>

                            {!notification.read_at && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            )}
                          </div>

                          <p className="text-sm text-slate-600 mt-1">
                            {notification.message || 'New WAGI Stationeries update.'}
                          </p>

                          {notification.created_at && (
                            <p className="text-xs text-slate-400 mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Refresh notifications
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Admin */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            AD
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user?.name || 'Admin'}
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => logout()}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Logout
        </button>

      </div>
    </header>
  )
}