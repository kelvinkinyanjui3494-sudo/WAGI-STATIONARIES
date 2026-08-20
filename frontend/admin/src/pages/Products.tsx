
import React, { useEffect, useState } from 'react'
import api from '../api'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { Link, useNavigate } from 'react-router-dom'

type ProductImage = {
  id: number
  url: string
  alt?: string
  is_primary?: boolean
}

type Product = {
  id: number
  name: string
  sku: string
  price: number
  stock_qty: number
  availability?: string
  images?: ProductImage[]
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const fetchProducts = async () => {
    setLoading(true)

    try {
      const res = await api.get('/api/admin/products')
      const data = res.data?.data ?? res.data ?? []

      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await api.delete(`/api/admin/products/${id}`)
      await fetchProducts()
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
        'Failed to delete product.'
      )
    }
  }

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase()

    return (
      product.name?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Header />

        <div className="p-6">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Products
              </h1>

              <p className="text-gray-600 mt-1">
                Manage your WAGI Stationeries products and inventory.
              </p>
            </div>

            <Link
              to="/products/new"
              className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 cursor-pointer inline-block text-center"
            >
              + Add Product
            </Link>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={fetchProducts}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer"
              >
                Search
              </button>

            </div>
          </div>

          {/* Product Catalogue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                Product Catalogue
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="p-10 text-center text-gray-500">
                Loading products...
              </div>

            ) : filteredProducts.length === 0 ? (

              /* Empty State */
              <div className="p-12 text-center">

                <div className="text-5xl mb-4">
                  📦
                </div>

                <h3 className="text-lg font-semibold text-gray-800">
                  No products found
                </h3>

                <p className="text-gray-500 mt-2 mb-6">
                  Your product catalogue is currently empty.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/products/new')}
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold cursor-pointer"
                >
                  Add Your First Product
                </button>

              </div>

            ) : (

              /* Products Table */
              <div className="overflow-x-auto">
                <table className="w-full">

<thead className="bg-gray-50">
  <tr>
    <th className="text-left p-4">Image</th>
    <th className="text-left p-4">#</th>
    <th className="text-left p-4">Name</th>
    <th className="text-left p-4">SKU</th>
    <th className="text-left p-4">Price</th>
    <th className="text-left p-4">Stock</th>
    <th className="text-left p-4">Actions</th>
  </tr>
</thead>

                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t hover:bg-gray-50"
                      >

                       
<td className="p-4">
  {product.images && product.images.length > 0 ? (
    <img
      src={product.images.find((image) => image.is_primary)?.url || product.images[0].url}
      alt={product.images.find((image) => image.is_primary)?.alt || product.name}
      className="w-16 h-16 object-cover rounded-lg border"
    />
  ) : (
    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
      No image
    </div>
  )}
</td>
                     

                        <td className="p-4 font-medium">
                          {product.name}
                        </td>

                        <td className="p-4">
                          {product.sku}
                        </td>

                        <td className="p-4">
                          KES {Number(product.price || 0).toLocaleString()}
                        </td>

                        <td className="p-4">
                          {product.stock_qty ?? 0}
                        </td>

                        <td className="p-4">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/products/${product.id}/edit`)
                            }
                            className="text-blue-600 hover:text-blue-800 mr-4 cursor-pointer"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  )
}

