import React from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function Settings() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <Header />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Settings
          </h1>

          <p className="text-gray-500 mt-1">
            Manage WAGI Stationeries administration settings.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Store Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Store Name
              </label>

              <input
                type="text"
                value="WAGI - STATIONARIES"
                readOnly
                className="w-full border rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Currency
              </label>

              <input
                type="text"
                value="KES"
                readOnly
                className="w-full border rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Location
              </label>

              <input
                type="text"
                value="Latema Road, Nairobi"
                readOnly
                className="w-full border rounded-lg px-4 py-2 bg-gray-50"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}