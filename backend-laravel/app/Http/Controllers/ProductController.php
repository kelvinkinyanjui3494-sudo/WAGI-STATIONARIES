<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\ProductImage;

class ProductController extends Controller
{
    // List products with basic pagination and search
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
            $query->where('category_id', $request->query('category'));
        }

        // Minimum price
        if ($request->filled('min')) {
            $query->where('price', '>=', $request->query('min'));
        }

        // Maximum price
        if ($request->filled('max')) {
            $query->where('price', '<=', $request->query('max'));
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
            max((int) $request->query('per_page', 12), 1),
            100
        );

        $products = $query
            ->with('images')
            ->paginate($perPage);

        return response()->json($products);
    }

    // Show a single product
    public function show($id)
    {
        $product = Product::with([
            'images',
            'category',
        ])->findOrFail($id);

        return response()->json($product);
    }

    // Admin: create product
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'price' => 'required|numeric',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    // Admin: update product
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric',
            'stock_qty' => 'sometimes|integer',
            'availability' => 'sometimes|string',
        ]);

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $product->update($data);

        return response()->json($product);
    }

    // Admin: upload image for product
    // Stores in local disk (storage/app/public/products/{sku}/)
    public function uploadImage(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'image' => 'required|image|max:5120',
            'is_primary' => 'sometimes|boolean',
            'alt' => 'sometimes|string|max:255',
        ]);

        $file = $request->file('image');

        // Create directory by SKU for organization
        $sku = $product->sku ?? 'product_' . $product->id;
        $path = "products/{$sku}";

        // Unique filename
        $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();

        // Store file on public disk
        $storedPath = $file->storeAs($path, $filename, 'public');

        // Get public URL
        $url = Storage::disk('public')->url($storedPath);

        // Create database record
        $image = ProductImage::create([
            'product_id' => $product->id,
            'path' => $storedPath,
            'url' => $url,
            'is_primary' => $request->boolean('is_primary', false),
            'alt' => $request->input('alt', $product->name),
        ]);

        // If marked primary, clear other primary flags
        if ($image->is_primary) {
            ProductImage::where('product_id', $product->id)
                ->where('id', '!=', $image->id)
                ->update(['is_primary' => false]);
        }

        return response()->json($image, 201);
    }

    // Admin: delete an image
    public function deleteImage(Request $request, $id, $imageId)
    {
        $product = Product::findOrFail($id);

        $image = ProductImage::where('product_id', $product->id)
            ->where('id', $imageId)
            ->firstOrFail();

        // Delete file from storage
        if ($image->path && Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();

        return response()->json([
            'deleted' => true,
        ]);
    }
}
