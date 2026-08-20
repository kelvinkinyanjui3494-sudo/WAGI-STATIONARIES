import React, { useEffect, useState } from 'react'
import api from '../api'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

type Customer = {
  id: number
  name: string
  email: string
  phone?: string
  is_active?: boolean
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      const response = await api.get('/api/admin/customers')

      setCustomers(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      )
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <Header />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Customers
          </h1>

          <p className="text-gray-500 mt-1">
            Manage WAGI Stationeries customers.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No customers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        #{customer.id}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {customer.name}
                      </td>

                      <td className="px-5 py-4">
                        {customer.email}
                      </td>

                      <td className="px-5 py-4">
                        {customer.phone || '-'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            customer.is_active === false
                              ? 'text-red-600'
                              : 'text-green-600'
                          }
                        >
                          {customer.is_active === false
                            ? 'Inactive'
                            : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}