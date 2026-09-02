<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\ProductImage;

class ProductController extends Controller
{
    /**
     * Public product listing.
     */
    public function index(Request $request)
    {
        $query = Product::query();

        // Search
        if ($request->filled('q')) {
            $q = $request->query('q');

            $query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->where(
                'category_id',
                $request->query('category')
            );
        }

        // Minimum price
        if ($request->filled('min')) {
            $query->where(
                'price',
                '>=',
                $request->query('min')
            );
        }

        // Maximum price
        if ($request->filled('max')) {
            $query->where(
                'price',
                '<=',
                $request->query('max')
            );
        }

        // In-stock filter
        if ($request->boolean('inStock')) {
            $query->where('stock_qty', '>', 0);
        }

        // Sorting
        switch ($request->query('sort', 'newest')) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;

            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;

            case 'rating':
                $query->orderBy('rating', 'desc');
                break;

            case 'popular':
                $query->orderBy('rating', 'desc');
                break;

            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = min(
            max(
                (int) $request->query('per_page', 12),
                1
            ),
            100
        );

        $products = $query
            ->with([
                'images' => function ($query) {
                    $query->orderByDesc('is_primary')
                        ->orderBy('id');
                }
            ])
            ->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Show a single product.
     *
     * Works with either numeric ID or slug.
     */
    public function show($id)
    {
        $product = Product::with([
            'images' => function ($query) {
                $query->orderByDesc('is_primary')
                    ->orderBy('id');
            },
            'category',
        ])
            ->where(function ($query) use ($id) {
                $query->where('id', $id)
                    ->orWhere('slug', $id);
            })
            ->firstOrFail();

        return response()->json($product);
    }

    /**
     * Admin: create product.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'price' => 'required|numeric',
            'stock_qty' => 'sometimes|integer|min:0',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'description' => 'sometimes|nullable|string',
            'brand' => 'sometimes|nullable|string|max:255',
            'barcode' => 'sometimes|nullable|string|max:255',
            'subcategory' => 'sometimes|nullable|string|max:255',
            'discount_price' => 'sometimes|nullable|numeric|min:0',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    /**
     * Admin: update product.
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:100|unique:products,sku,' . $product->id,
            'price' => 'sometimes|numeric',
            'stock_qty' => 'sometimes|integer|min:0',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'description' => 'sometimes|nullable|string',
            'brand' => 'sometimes|nullable|string|max:255',
            'barcode' => 'sometimes|nullable|string|max:255',
            'subcategory' => 'sometimes|nullable|string|max:255',
            'discount_price' => 'sometimes|nullable|numeric|min:0',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $product->update($data);

        return response()->json($product);
    }

    /**
     * Admin: upload a product image.
     *
     * Images are stored on Laravel's public disk:
     *
     * storage/app/public/products/{sku}/filename
     *
     * The public/storage symbolic link exposes these files through:
     *
     * http://127.0.0.1:8000/storage/...
     */
    public function uploadImage(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            'is_primary' => 'sometimes|boolean',
            'alt' => 'sometimes|nullable|string|max:255',
        ]);

        $file = $request->file('image');

        /*
         * Use the product SKU as the storage folder.
         * This keeps images organized and matches the existing
         * database paths such as products/NOTE-BOOK-001/...
         */
        $sku = $product->sku ?: 'product_' . $product->id;

        /*
         * Keep the folder name safe for Windows/Linux filesystems.
         */
        $folderName = Str::slug($sku);

        if ($folderName === '') {
            $folderName = 'product_' . $product->id;
        }

        $directory = "products/{$folderName}";

        /*
         * Create a unique filename.
         */
        $extension = strtolower(
            $file->getClientOriginalExtension()
        );

        $filename = now()->format('YmdHis')
            . '_' .
            Str::random(12)
            . '.' .
            $extension;

        /*
         * Store the actual file on Laravel's public disk.
         */
        $storedPath = $file->storeAs(
            $directory,
            $filename,
            'public'
        );

        if (!$storedPath) {
            return response()->json([
                'message' => 'The image could not be saved.',
            ], 500);
        }

        /*
         * Build the public URL explicitly from the running
         * Laravel application.
         *
         * This avoids old localhost URLs being stored in the
         * database when the API is running on 127.0.0.1:8000.
         */
        $url = rtrim(
            config('app.url', 'http://127.0.0.1:8000'),
            '/'
        ) . '/storage/' . ltrim($storedPath, '/');

        /*
         * If the admin marks this image as primary, remove the
         * primary flag from every other image first.
         *
         * When this is the first image, automatically make it
         * primary even if the admin did not explicitly send
         * is_primary.
         */
        $hasExistingImages = ProductImage::where(
            'product_id',
            $product->id
        )->exists();

        $isPrimary = $request->has('is_primary')
            ? $request->boolean('is_primary')
            : !$hasExistingImages;

        if ($isPrimary) {
            ProductImage::where(
                'product_id',
                $product->id
            )->update([
                'is_primary' => false,
            ]);
        }

        /*
         * Save the image record.
         */
        $image = ProductImage::create([
            'product_id' => $product->id,
            'path' => $storedPath,
            'url' => $url,
            'is_primary' => $isPrimary,
            'alt' => $request->input(
                'alt',
                $product->name
            ),
        ]);

        /*
         * Return the complete image record so the admin frontend
         * immediately knows which image was uploaded.
         */
        return response()->json([
            'id' => $image->id,
            'product_id' => $image->product_id,
            'path' => $image->path,
            'url' => $image->url,
            'is_primary' => (bool) $image->is_primary,
            'alt' => $image->alt,
            'meta' => $image->meta,
            'created_at' => $image->created_at,
            'updated_at' => $image->updated_at,
        ], 201);
    }

    /**
     * Admin: delete an image.
     */
    public function deleteImage(
        Request $request,
        $id,
        $imageId
    ) {
        $product = Product::findOrFail($id);

        $image = ProductImage::where(
            'product_id',
            $product->id
        )
            ->where('id', $imageId)
            ->firstOrFail();

        $wasPrimary = (bool) $image->is_primary;

        /*
         * Delete the actual image file from storage.
         */
        if (
            $image->path &&
            Storage::disk('public')->exists($image->path)
        ) {
            Storage::disk('public')->delete(
                $image->path
            );
        }

        $image->delete();

        /*
         * If the deleted image was primary, automatically choose
         * another remaining image as the new primary image.
         */
        if ($wasPrimary) {
            $replacement = ProductImage::where(
                'product_id',
                $product->id
            )
                ->orderBy('id')
                ->first();

            if ($replacement) {
                $replacement->update([
                    'is_primary' => true,
                ]);
            }
        }

        return response()->json([
            'deleted' => true,
        ]);
    }
}

