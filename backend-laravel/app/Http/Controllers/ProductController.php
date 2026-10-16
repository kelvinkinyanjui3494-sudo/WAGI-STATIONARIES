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

        // Search by product name or SKU.
        if ($request->filled('q')) {
            $q = $request->query('q');

            $query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%");
            });
        }

        // Category filter.
        if ($request->filled('category')) {
            $query->where(
                'category_id',
                $request->query('category')
            );
        }

        // Minimum price.
        if ($request->filled('min')) {
            $query->where(
                'price',
                '>=',
                $request->query('min')
            );
        }

        // Maximum price.
        if ($request->filled('max')) {
            $query->where(
                'price',
                '<=',
                $request->query('max')
            );
        }

        // In-stock filter.
        if ($request->boolean('inStock')) {
            $query->where('stock_qty', '>', 0);
        }

        // Sorting.
        switch ($request->query('sort', 'newest')) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;

            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;

            case 'rating':
            case 'popular':
                $query->orderBy('rating', 'desc');
                break;

            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = min(
            max((int) $request->query('per_page', 12), 1),
            100
        );

        $products = $query
            ->with([
                'images' => function ($query) {
                    $query->orderByDesc('is_primary')
                        ->orderBy('id');
                },
            ])
            ->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Show a single product by ID or slug.
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
     * Admin: upload a product image to Cloudinary.
     *
     * The database continues to store the image path and URL
     * in the existing ProductImage table.
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

        // Create a safe folder name based on the product SKU.
        $sku = $product->sku ?: 'product_' . $product->id;
        $folderName = Str::slug($sku);

        if ($folderName === '') {
            $folderName = 'product_' . $product->id;
        }

        $directory = "products/{$folderName}";

        // Generate a unique filename.
        $extension = strtolower(
            $file->getClientOriginalExtension()
        );

        $filename = now()->format('YmdHis')
            . '_'
            . Str::random(12)
            . '.'
            . $extension;

        $storedPath = null;

        try {
            // Store the image on Cloudinary, not Render's local disk.
            $storedPath = $file->storeAs(
                $directory,
                $filename,
                'cloudinary'
            );

            if (!$storedPath) {
                return response()->json([
                    'message' => 'The image could not be uploaded.',
                ], 500);
            }

            // Obtain the secure URL from Cloudinary.
            $url = Storage::disk('cloudinary')->url($storedPath);

            if (
                !is_string($url) ||
                !str_starts_with($url, 'https://')
            ) {
                Storage::disk('cloudinary')->delete($storedPath);

                return response()->json([
                    'message' => 'Cloudinary did not return a valid HTTPS image URL.',
                ], 500);
            }
        } catch (\Throwable $e) {
            report($e);

            // Attempt to clean up the uploaded file if URL retrieval failed.
            if ($storedPath) {
                try {
                    Storage::disk('cloudinary')->delete($storedPath);
                } catch (\Throwable $cleanupException) {
                    report($cleanupException);
                }
            }

            return response()->json([
                'message' => 'The image could not be uploaded or its URL could not be retrieved. Check the server logs.',
            ], 500);
        }

        // Determine whether this image should become the primary image.
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

        try {
            // Keep the existing database columns and response format.
            $image = ProductImage::create([
                'product_id' => $product->id,
                'path' => $storedPath,
                'url' => $url,
                'is_primary' => $isPrimary,
                'alt' => $request->input('alt', $product->name),
            ]);
        } catch (\Throwable $e) {
            report($e);

            // Remove the uploaded asset if the database save fails.
            try {
                Storage::disk('cloudinary')->delete($storedPath);
            } catch (\Throwable $cleanupException) {
                report($cleanupException);
            }

            return response()->json([
                'message' => 'The image was uploaded, but its database record could not be saved.',
            ], 500);
        }

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
     * Admin: delete a product image from its storage location.
     *
     * Cloudinary images are deleted from Cloudinary.
     * Older local images are handled using the public disk.
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

        if ($image->path) {
            $isCloudinaryImage = str_starts_with(
                (string) $image->url,
                'https://res.cloudinary.com/'
            );

            try {
                if ($isCloudinaryImage) {
                    // Do not remove the database row if cloud deletion fails.
                    Storage::disk('cloudinary')->delete($image->path);
                } elseif (Storage::disk('public')->exists($image->path)) {
                    // Preserve support for older local-storage images.
                    Storage::disk('public')->delete($image->path);
                }
            } catch (\Throwable $e) {
                report($e);

                return response()->json([
                    'message' => 'The image file could not be deleted. The image record has been retained.',
                ], 500);
            }
        }

        $image->delete();

        // Select another image as primary if the deleted image was primary.
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
