<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\ProductImage;

class AdminProductsController extends Controller
{
    // existing methods (index, destroy, replaceImage, deleteImage) remain

    public function index(Request $request)
    {
        $q = $request->query('q');
        $category = $request->query('category');
        $stock = $request->query('stock'); // low, out
        $perPage = (int)$request->query('per_page', 20);

        $query = Product::query();

        if ($q) {
            $query->where(function($s) use ($q) { $s->where('name','like','%'.$q.'%')->orWhere('sku','like','%'.$q.'%'); });
        }
        if ($category) $query->where('category_id', $category);
        if ($stock === 'low') $query->where('stock_qty', '<=', 5);
        if ($stock === 'out') $query->where('stock_qty', '<=', 0);

        $data = $query->with('images')->orderBy('created_at','desc')->paginate($perPage);
        return response()->json($data);
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'price' => 'required|numeric',
            'stock_qty' => 'sometimes|integer',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'description' => 'sometimes|nullable|string',
        ]);
        if ($v->fails()) return response()->json(['errors'=>$v->errors()],422);

        $data = $request->only(['name','sku','price','stock_qty','category_id','description','brand','barcode','subcategory','discount_price']);
        $data['slug'] = Str::slug($data['name'] ?? $request->name);
        $product = Product::create($data);

        return response()->json($product, 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $v = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:100|unique:products,sku,'.$product->id,
            'price' => 'sometimes|numeric',
            'stock_qty' => 'sometimes|integer',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'description' => 'sometimes|nullable|string',
        ]);
        if ($v->fails()) return response()->json(['errors'=>$v->errors()],422);

        $product->update($request->only(['name','sku','price','stock_qty','category_id','description','brand','barcode','subcategory','discount_price']));
        if ($request->has('name')) $product->slug = Str::slug($request->name);
        $product->save();

        return response()->json($product);
    }

    // Replace image and deleteImage methods unchanged (already present earlier in file)
}
