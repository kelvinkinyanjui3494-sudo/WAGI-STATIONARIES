<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\Category;

class AdminCategoriesController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 20);
        $q = $request->query('q');

        $query = Category::query();
        if ($q) $query->where('name', 'like', "%{$q}%");

        return response()->json($query->orderBy('name')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'parent_id' => 'sometimes|nullable|exists:categories,id',
        ]);
        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        $cat = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name).'-'.Str::random(4),
            'parent_id' => $request->parent_id,
        ]);

        return response()->json($cat, 201);
    }

    public function update(Request $request, $id)
    {
        $cat = Category::findOrFail($id);
        $v = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'sometimes|nullable|exists:categories,id',
        ]);
        if ($v->fails()) return response()->json(['errors' => $v->errors()], 422);

        if ($request->has('name')) {
            $cat->name = $request->name;
            $cat->slug = Str::slug($request->name).'-'.Str::random(4);
        }
        if ($request->has('parent_id')) $cat->parent_id = $request->parent_id;
        $cat->save();

        return response()->json($cat);
    }

    public function destroy($id)
    {
        $cat = Category::findOrFail($id);
        // optionally check for child categories or products
        $cat->delete();
        return response()->json(['deleted' => true]);
    }
}
