import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Orders from './pages/Orders'
import Customers from './pages/Customers'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

import { AuthProvider } from './auth'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Products */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        {/* Add Product */}
        <Route
          path="/products/new"
          element={
            <ProtectedRoute>
              <ProductForm />
            </ProtectedRoute>
          }
        />

        {/* Edit Product */}
        <Route
          path="/products/:id/edit"
          element={
            <ProtectedRoute>
              <ProductForm />
            </ProtectedRoute>
          }
        />

        {/* Orders */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Unknown pages */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </AuthProvider>
  )
}