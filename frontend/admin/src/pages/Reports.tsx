import React, { useEffect, useState } from 'react'
import api from '../api'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

type Sale = {
  day?: string
  month?: string
  total: number
}

export default function Reports() {
  const [dailySales, setDailySales] = useState<Sale[]>([])
  const [monthlySales, setMonthlySales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [daily, monthly] = await Promise.all([
          api.get('/api/admin/reports/daily'),
          api.get('/api/admin/reports/monthly'),
        ])

        setDailySales(daily.data || [])
        setMonthlySales(monthly.data || [])
      } catch (error) {
        console.error('Failed to load reports:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <Header />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Reports
          </h1>

          <p className="text-gray-500 mt-1">
            View WAGI Stationeries sales reports.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            Loading reports...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Daily Sales
              </h2>

              {dailySales.length === 0 ? (
                <p className="text-gray-500">
                  No daily sales data available.
                </p>
              ) : (
                <div className="space-y-3">
                  {dailySales.map((sale, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b pb-2"
                    >
                      <span>{sale.day}</span>

                      <span className="font-semibold">
                        KES {Number(sale.total).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Monthly Sales
              </h2>

              {monthlySales.length === 0 ? (
                <p className="text-gray-500">
                  No monthly sales data available.
                </p>
              ) : (
                <div className="space-y-3">
                  {monthlySales.map((sale, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b pb-2"
                    >
                      <span>{sale.month}</span>

                      <span className="font-semibold">
                        KES {Number(sale.total).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}