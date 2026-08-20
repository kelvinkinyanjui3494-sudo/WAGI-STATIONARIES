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
     * List products with search, filtering, sorting and pagination.
     */
    public function index(Request $request)
    {
        $query = Product::with('images');

        // Search
        if ($request->filled('q')) {
            $q = $request->query('q');

            $query->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('brand', 'like', "%{$q}%");
            });
        }

        // Category
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

        // In stock
        if ($request->boolean('inStock')) {
            $query->where('stock_qty', '>', 0);
        }

        // Sorting
        switch ($request->query('sort')) {
            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;

            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;

            case 'rating':
                $query->orderBy('rating', 'desc');
                break;

            default:
                $query->latest();
                break;
        }

        return response()->json(
            $query->paginate(20)
        );
    }

    /**
     * Show a single product.
     */
    public function show($id)
    {
        $product = Product::with('images')->findOrFail($id);

        return response()->json($product);
    }

    /**
     * Upload an image for a product.
     */
    public function uploadImage(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'image' => 'required|image|max:5120',
            'is_primary' => 'sometimes|boolean',
            'alt' => 'sometimes|string|max:255',
        ]);

        $file = $request->file('image');

        $sku = $product->sku ?? 'product_' . $product->id;
        $path = "products/{$sku}";

        $filename = time() . '_' . Str::random(8) . '.' .
            $file->getClientOriginalExtension();

        $storedPath = $file->storeAs(
            $path,
            $filename,
            'public'
        );
$url = url('/storage/' . $storedPath);

        $image = ProductImage::create([
            'product_id' => $product->id,
            'path' => $storedPath,
            'url' => $url,
            'is_primary' => $request->boolean('is_primary', false),
            'alt' => $request->input('alt', $product->name),
        ]);

        if ($image->is_primary) {
            ProductImage::where('product_id', $product->id)
                ->where('id', '!=', $image->id)
                ->update([
                    'is_primary' => false,
                ]);
        }

        return response()->json($image, 201);
    }
}