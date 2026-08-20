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
        $q = $request->query('q');
        $query = Product::query();

        if ($q) {
            $query->where('name', 'like', "%{$q}%")->orWhere('sku', 'like', "%{$q}%");
        }

        $products = $query->with('images')->paginate(20);

        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::with('images')->findOrFail($id);
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
            'image' => 'required|image|max:5120', // max 5MB
            'is_primary' => 'sometimes|boolean',
            'alt' => 'sometimes|string|max:255'
        ]);

        $file = $request->file('image');

        // Create directory by SKU for organization
        $sku = $product->sku ?? 'product_'.$product->id;
        $path = "products/{$sku}";

        // Unique filename
        $filename = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();

        // Store file on 'public' disk
        $storedPath = $file->storeAs($path, $filename, 'public');

        // Get public URL (requires php artisan storage:link)
        $url = Storage::disk('public')->url($storedPath);

        // Create DB record
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
        $image = ProductImage::where('product_id', $product->id)->where('id', $imageId)->firstOrFail();

        // Delete file from storage
        if ($image->path && Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $image->delete();

        return response()->json(['deleted' => true]);
    }
}
