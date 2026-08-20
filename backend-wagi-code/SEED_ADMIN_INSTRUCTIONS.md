### Seeding the Admin User (secure)

The repository includes a dedicated seeder `AdminUserSeeder` that creates or updates an administrator account using environment variables so no plaintext password is committed to source control.

How to run the seeder (example):

On Linux/macOS:

SEED_ADMIN_EMAIL=wagistationaries2026@gmail.com SEED_ADMIN_NAME="WAGI Admin" SEED_ADMIN_PASSWORD='REPLACE_WITH_TEMP_PASSWORD' php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder

On Windows (PowerShell):

$env:SEED_ADMIN_EMAIL="wagistationaries2026@gmail.com"; $env:SEED_ADMIN_NAME="WAGI Admin"; $env:SEED_ADMIN_PASSWORD="REPLACE_WITH_TEMP_PASSWORD"; php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder

Notes:
- The seeder will abort if SEED_ADMIN_PASSWORD is not set.
- Only the hashed password is stored in the database; the plaintext password is not committed to the repo.
- After seeding, immediately log in and change the password to a secure permanent one.
