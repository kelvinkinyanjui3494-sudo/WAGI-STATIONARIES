# Backend Setup (Laravel) — WAGI - STATIONARIES

This guide explains how to integrate the provided files into a Laravel backend and run the project locally.

Prerequisites
- PHP 8.1+ (Laravel 12 recommends PHP 8.1+; user-specified target: PHP 8.4)
- Composer
- MySQL 8+
- Node.js + npm/yarn (for the admin frontend)

Steps
1. Create the Laravel project (if you don't have it yet):
   - composer create-project laravel/laravel backend "12.*"
   - cd backend

2. Copy the provided files into your Laravel project:
   - Place `backend/routes/api.php` contents into `routes/api.php` (merge if you already have routes).
   - Place Controllers into `app/Http/Controllers/`.
   - Place Models into `app/Models/`.
   - Place migration SQL in `sql/wagi_store_schema.sql` for reference or translate into Laravel migrations (recommended).

3. Environment
   - Copy `backend/.env.example` to `.env` and fill DB credentials.
   - Run `php artisan key:generate`.

4. Storage
   - Run `php artisan storage:link` to create the `public/storage` symbolic link for local file serving.

5. Migrations
   - The repo includes `sql/wagi_store_schema.sql` which you can import manually into MySQL, or translate into Laravel migrations and run `php artisan migrate`.

6. Seed an admin user
   - Use tinker or create a seeder to create an admin user. Example using tinker:
     php artisan tinker
     \>>> use App\Models\User;
     \>>> User::create(['name'=>'Admin','email'=>'admin@wagistationaries.test','password'=>bcrypt('ChangeMe123!'),'role'=>'admin']);

7. Run the dev server
   - php artisan serve
   - Visit http://127.0.0.1:8000

Notes on Image Uploads (no external credentials required)
- Product image upload endpoint stores files in `storage/app/public/products/{product_sku}/`.
- Laravel's Storage facade returns public URLs via `Storage::url()` after you create the `storage` symlink.
- Later, to use Cloudinary, set `CLOUDINARY_*` env vars and update the storage driver or add a service class to upload to Cloudinary.

Admin Frontend
- A React/TypeScript component `frontend/admin/src/components/ProductImageUpload.tsx` is included as an example. It uploads the file to `POST /api/admin/products/{id}/images` using multipart/form-data.

Security
- This initial setup uses local storage for images and does not require external API keys. Keep your `.env` out of source control.
