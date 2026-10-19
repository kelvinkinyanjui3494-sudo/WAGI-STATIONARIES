import React, { useEffect, useState } from 'react'
import api from '../api'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setError('')
      const res = await api.get('/api/admin/orders')
      const data = res.data?.data ?? res.data
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to fetch orders:', e)
      setError('Unable to load orders. Please refresh and try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.post(`/api/admin/orders/${id}/status`, { status })
      await fetchOrders()
    } catch (e) {
      console.error('Failed to update order status:', e)
      setError('Unable to update order status. Please try again.')
    }
  }

  const formatAddress = (address: any) => {
    if (!address) return []

    // The Laravel Order model casts delivery_address to an array.
    // Support both structured addresses and plain text addresses.
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address)
      } catch {
        return [address]
      }
    }

    if (typeof address !== 'object' || Array.isArray(address)) {
      return []
    }

    const fields = [
      ['County', address.county],
      ['Town', address.town],
      ['Estate', address.estate],
      ['Street', address.street],
      ['House / Building', address.house_number || address.building],
      ['Nearest landmark', address.nearest_landmark],
      ['Instructions', address.instructions],
    ]

    return fields
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
      .map(([label, value]) => `${label}: ${value}`)
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />

      <div className="flex-1 min-w-0 p-6">
        <Header />

        <h2 className="text-2xl font-semibold mb-4">Orders</h2>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          {loading ? (
            <p className="p-4">Loading orders...</p>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Order #</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Delivery Address</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(o => {
                  const addressLines = formatAddress(o.delivery_address)

                  return (
                    <tr key={o.id} className="border-t align-top">
                      <td className="p-2 whitespace-nowrap">
                        {o.order_number}
                      </td>

                      <td className="p-2">
                        {o.user?.name || `Customer ID: ${o.user_id}`}
                      </td>

                      <td className="p-2 min-w-[220px]">
                        {addressLines.length > 0 ? (
                          <div className="space-y-1">
                            {addressLines.map((line, index) => (
                              <div key={index} className="text-sm">
                                {line}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            No delivery address returned
                          </span>
                        )}
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        KES {o.total}
                      </td>

                      <td className="p-2 whitespace-nowrap">
                        {o.payment_method} / {o.payment_status}
                      </td>

                      <td className="p-2">{o.status}</td>

                      <td className="p-2">
                        <div className="flex flex-wrap gap-2 min-w-[220px]">
                          <button
                            onClick={() => updateStatus(o.id, 'approved')}
                            className="px-2 py-1 bg-green-600 text-white rounded"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => updateStatus(o.id, 'processing')}
                            className="px-2 py-1 bg-yellow-600 text-white rounded"
                          >
                            Process
                          </button>

                          <button
                            onClick={() => updateStatus(o.id, 'shipped')}
                            className="px-2 py-1 bg-blue-600 text-white rounded"
                          >
                            Ship
                          </button>

                          <button
                            onClick={() => updateStatus(o.id, 'delivered')}
                            className="px-2 py-1 bg-gray-800 text-white rounded"
                          >
                            Deliver
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}