<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Return categories for the public WAGI Stationaries storefront.
     */
    public function index(Request $request)
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'slug',
                'parent_id',
            ]);

        return response()->json($categories);
    }
}