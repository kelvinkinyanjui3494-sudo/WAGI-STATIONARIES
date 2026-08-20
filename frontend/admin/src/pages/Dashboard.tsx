
import React, { useEffect, useState } from 'react'
import api from '../api'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

type Stats = {
  total_sales: number
  todays_sales: number
  monthly_sales: number
  total_customers: number
  total_products: number
  pending_orders: number
  processing_orders: number
  delivered_orders: number
  cancelled_orders: number
  low_stock_products: number
  out_of_stock_products: number
}

const money = (value: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value || 0)

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/api/admin/stats')
      setStats(response.data)
    } catch (err: any) {
      console.error(err)

      setError(
        err?.response?.data?.message ||
          'Could not load dashboard statistics.'
      )
    } finally {
      setLoading(false)
    }
  }

  const orderTotal =
    (stats?.pending_orders || 0) +
    (stats?.processing_orders || 0) +
    (stats?.delivered_orders || 0) +
    (stats?.cancelled_orders || 0)

  const pendingPercent =
    orderTotal > 0
      ? Math.round(((stats?.pending_orders || 0) / orderTotal) * 100)
      : 0

  const processingPercent =
    orderTotal > 0
      ? Math.round(((stats?.processing_orders || 0) / orderTotal) * 100)
      : 0

  const deliveredPercent =
    orderTotal > 0
      ? Math.round(((stats?.delivered_orders || 0) / orderTotal) * 100)
      : 0

  const cancelledPercent =
    orderTotal > 0
      ? Math.round(((stats?.cancelled_orders || 0) / orderTotal) * 100)
      : 0

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Header />

        <div className="p-6 lg:p-8">

          {/* Welcome */}
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, Admin! 👋
            </h1>

            <p className="text-slate-500 mt-1">
              Here's what's happening with your store today.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center text-slate-500">
              Loading dashboard...
            </div>
          ) : stats ? (
            <>
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

                {/* Sales */}
                <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        Total Sales
                      </p>

                      <h2 className="text-2xl font-bold mt-2">
                        {money(stats.total_sales)}
                      </h2>

                      <p className="text-blue-100 text-sm mt-3">
                        Current total sales
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                      🛒
                    </div>
                  </div>
                </div>

                {/* Orders */}
                <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-emerald-600 to-green-500 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">
                        Total Orders
                      </p>

                      <h2 className="text-3xl font-bold mt-2">
                        {orderTotal}
                      </h2>

                      <p className="text-green-100 text-sm mt-3">
                        All order statuses
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                      📦
                    </div>
                  </div>
                </div>

                {/* Customers */}
                <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-purple-600 to-violet-500 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">
                        Customers
                      </p>

                      <h2 className="text-3xl font-bold mt-2">
                        {stats.total_customers}
                      </h2>

                      <p className="text-purple-100 text-sm mt-3">
                        Registered customers
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                      👥
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-orange-500 to-orange-400 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">
                        Products
                      </p>

                      <h2 className="text-3xl font-bold mt-2">
                        {stats.total_products}
                      </h2>

                      <p className="text-orange-100 text-sm mt-3">
                        Products in catalogue
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                      🛍️
                    </div>
                  </div>
                </div>
              </div>

              {/* SECOND ROW */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

                {/* Sales Overview */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Sales Overview
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        Your current sales performance
                      </p>
                    </div>

                    <div className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold">
                      Current
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Total
                      </p>

                      <p className="font-bold text-slate-900 mt-1">
                        {money(stats.total_sales)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        Today
                      </p>

                      <p className="font-bold text-slate-900 mt-1">
                        {money(stats.todays_sales)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-xs text-slate-500">
                        This Month
                      </p>

                      <p className="font-bold text-slate-900 mt-1">
                        {money(stats.monthly_sales)}
                      </p>
                    </div>
                  </div>

                  {/* Visual sales bar */}
                  <div className="h-48 flex items-end gap-3 border-b border-slate-200 px-2">
                    {[35, 48, 42, 65, 55, 78, 90].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 flex items-end h-full"
                        >
                          <div
                            className="w-full rounded-t-lg bg-blue-500/80 hover:bg-blue-600 transition"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 mt-3">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                {/* Order Status */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      Order Status
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Current order distribution
                    </p>
                  </div>

                  <div className="space-y-5">

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Pending
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {stats.pending_orders} ({pendingPercent}%)
                        </span>
                      </div>

                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${pendingPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Processing
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {stats.processing_orders} ({processingPercent}%)
                        </span>
                      </div>

                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${processingPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Delivered
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {stats.delivered_orders} ({deliveredPercent}%)
                        </span>
                      </div>

                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${deliveredPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          Cancelled
                        </span>

                        <span className="text-sm font-bold text-slate-900">
                          {stats.cancelled_orders} ({cancelledPercent}%)
                        </span>
                      </div>

                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${cancelledPercent}%` }}
                        />
                      </div>
                    </div>

                  </div>

                  <div className="mt-7 bg-slate-50 rounded-xl p-5 text-center">
                    <p className="text-sm text-slate-500">
                      Total Orders
                    </p>

                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {orderTotal}
                    </p>
                  </div>
                </div>
              </div>

              {/* THIRD ROW */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Inventory */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Inventory Overview
                      </h2>

                      <p className="text-sm text-slate-500 mt-1">
                        Current stock condition
                      </p>
                    </div>

                    <span className="text-2xl">📦</span>
                  </div>

                  <div className="p-6 space-y-5">

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Total Products
                        </p>

                        <p className="text-sm text-slate-500">
                          All products
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-blue-600">
                        {stats.total_products}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Low Stock
                        </p>

                        <p className="text-sm text-yellow-700">
                          5 or fewer items
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-yellow-600">
                        {stats.low_stock_products}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Out of Stock
                        </p>

                        <p className="text-sm text-red-600">
                          Needs restocking
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-red-600">
                        {stats.out_of_stock_products}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">
                      Business Summary
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      WAGI Stationeries overview
                    </p>
                  </div>

                  <div className="p-6 grid grid-cols-2 gap-4">

                    <div className="rounded-xl bg-blue-50 p-5">
                      <p className="text-sm text-blue-600 font-medium">
                        Today's Sales
                      </p>

                      <p className="text-xl font-bold text-blue-900 mt-2">
                        {money(stats.todays_sales)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-purple-50 p-5">
                      <p className="text-sm text-purple-600 font-medium">
                        Monthly Sales
                      </p>

                      <p className="text-xl font-bold text-purple-900 mt-2">
                        {money(stats.monthly_sales)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-50 p-5">
                      <p className="text-sm text-green-600 font-medium">
                        Delivered
                      </p>

                      <p className="text-xl font-bold text-green-900 mt-2">
                        {stats.delivered_orders}
                      </p>
                    </div>

                    <div className="rounded-xl bg-orange-50 p-5">
                      <p className="text-sm text-orange-600 font-medium">
                        Pending
                      </p>

                      <p className="text-xl font-bold text-orange-900 mt-2">
                        {stats.pending_orders}
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

