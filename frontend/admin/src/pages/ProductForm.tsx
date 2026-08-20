import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

type Category = {
  id: number
  name: string
}

type ProductImage = {
  id: number
  url: string
  alt?: string
  is_primary?: boolean
}

type ProductFormData = {
  name: string
  sku: string
  price: number
  stock_qty: number
  description: string
  category_id: number | null
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()

  const editMode = Boolean(id)

  const [form, setForm] = useState<ProductFormData>({
    name: '',
    sku: '',
    price: 0,
    stock_qty: 0,
    description: '',
    category_id: null,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()

    if (editMode && id) {
      loadProduct(id)
    }
  }, [editMode, id])

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/admin/categories')

      const data = response.data?.data ?? response.data ?? []

      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadProduct = async (productId: string) => {
    setPageLoading(true)
    setError('')

    try {
      const response = await api.get(`/api/products/${productId}`)

      const product = response.data

      setForm({
        name: product.name ?? '',
        sku: product.sku ?? '',
        price: Number(product.price ?? 0),
        stock_qty: Number(product.stock_qty ?? 0),
        description: product.description ?? '',
        category_id: product.category_id ?? null,
      })

      setImages(product.images ?? [])
    } catch (err: any) {
      console.error(err)

      setError(
        err?.response?.data?.message ||
        'Failed to load the product.'
      )
    } finally {
      setPageLoading(false)
    }
  }

  const updateField = (
    field: keyof ProductFormData,
    value: string | number | null
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      let product

      if (editMode && id) {
        const response = await api.put(
          `/api/admin/products/${id}`,
          form
        )

        product = response.data
      } else {
        const response = await api.post(
          '/api/admin/products',
          form
        )

        product = response.data
      }

      /*
       * Upload image after product has been created.
       */
if (imageFile && product?.id) {
  const formData = new FormData()

  formData.append('image', imageFile)
  formData.append('is_primary', '1')

  await api.post(
    `/api/admin/products/${product.id}/images`,
    formData
  )
}

      alert(
        editMode
          ? 'Product updated successfully.'
          : 'Product added successfully.'
      )

      navigate('/products')
    } catch (err: any) {
      console.error(err)

      const validationErrors =
        err?.response?.data?.errors

      if (validationErrors) {
        const messages = Object.values(validationErrors)
          .flat()
          .join('\n')

        setError(messages)
      } else {
        setError(
          err?.response?.data?.message ||
          'Failed to save the product.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!id) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this image?'
    )

    if (!confirmed) return

    try {
      await api.delete(
        `/api/admin/products/${id}/images/${imageId}`
      )

      setImages((previous) =>
        previous.filter((image) => image.id !== imageId)
      )
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
        'Failed to delete image.'
      )
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />

        <main className="flex-1 p-6">
          <Header />

          <div className="bg-white rounded-xl shadow p-8 text-center">
            Loading product...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <Header />

        <div className="max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit Product' : 'Add Product'}
              </h1>

              <p className="text-gray-500 mt-1">
                {editMode
                  ? 'Update this WAGI Stationeries product.'
                  : 'Add a new product to your WAGI Stationeries catalogue.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/products')}
              className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Back to Products
            </button>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 whitespace-pre-line">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >

            <div className="mb-5">
              <label className="block font-medium text-gray-700 mb-2">
                Product Name *
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateField('name', event.target.value)
                }
                placeholder="e.g. Note Books"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-5">
              <label className="block font-medium text-gray-700 mb-2">
                Category
              </label>

              <select
                value={form.category_id ?? ''}
                onChange={(event) =>
                  updateField(
                    'category_id',
                    event.target.value
                      ? Number(event.target.value)
                      : null
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
              >
                <option value="">
                  Uncategorized
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block font-medium text-gray-700 mb-2">
                SKU *
              </label>

              <input
                type="text"
                value={form.sku}
                onChange={(event) =>
                  updateField('sku', event.target.value)
                }
                placeholder="e.g. NOTE-BOOK-001"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Price (KES) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField(
                      'price',
                      Number(event.target.value)
                    )
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.stock_qty}
                  onChange={(event) =>
                    updateField(
                      'stock_qty',
                      Number(event.target.value)
                    )
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>

            </div>

            <div className="mt-5 mb-5">
              <label className="block font-medium text-gray-700 mb-2">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField(
                    'description',
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Describe this product..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
              />
            </div>

            <div className="mb-6">
              <label className="block font-medium text-gray-700 mb-2">
                {editMode
                  ? 'Add / Replace Product Image'
                  : 'Product Image'}
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(
                    event.target.files?.[0] ?? null
                  )
                }
                className="w-full border border-gray-300 rounded-lg p-3"
              />

              {imageFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>

            {images.length > 0 && (
              <div className="mb-6">

                <h2 className="font-semibold text-gray-800 mb-3">
                  Existing Images
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <img
                        src={image.url}
                        alt={image.alt || form.name}
                        className="w-full h-32 object-cover"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteImage(image.id)
                        }
                        className="w-full bg-red-50 text-red-600 py-2 text-sm hover:bg-red-100"
                      >
                        Delete Image
                      </button>
                    </div>
                  ))}

                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading
                  ? 'Saving...'
                  : editMode
                    ? 'Update Product'
                    : 'Save Product'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/products')}
                className="border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

            </div>

          </form>
        </div>
      </main>
    </div>
  )
}