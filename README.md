# Scentare Admin

React/Vite admin interface with a small PHP API using PDO and MariaDB.

## Project layout

- `src/` contains the React interface.
- `src/features/auth/` contains login UI and authentication requests.
- `src/features/dashboard/` contains the dashboard UI, data hook, and dashboard API client.
- `backend/config/` holds database connection and shared API/session setup.
- `backend/public/api/` contains the auth, dashboard, products, categories, customers, reviews, orders, reports, and activity endpoints.
- `backend/services/DashboardService.php` queries orders, sales, inventory, and best sellers from the schema.
- `.env.example` is the local PHP API configuration template.
- `database/perfume_ordering.sql` contains the database schema and seed data.

## Run locally with XAMPP

1. Start Apache and MySQL in the XAMPP Control Panel.
2. In phpMyAdmin, create/import the `perfume_ordering` database using `database/perfume_ordering.sql`.
3. If you already imported an older database dump, run `database/migrations/20261028_add_category_visibility.sql`, `database/migrations/20261028_add_customer_status.sql`, `database/migrations/20261028_create_activity_logs.sql`, and `database/migrations/20261101_add_review_moderation_status.sql` once each in phpMyAdmin. The current dump already includes these changes.
4. Copy `.env.example` to `backend/.env` and set the database username/password for your local MariaDB. XAMPP commonly uses `root` with an empty password.
5. Run `npm run dev` from the project folder and open the Vite URL it prints. This starts both Vite and the PHP API server; Vite forwards `/api` requests to PHP. The login uses HttpOnly session cookies, CSRF tokens, prepared SQL statements, and PHP password verification; only rows with `users.role = 'admin'` can sign in.

After sign-in, the dashboard loads current data from `orders`, `order_items`, `products`, and `users`. Orders can be searched, filtered, exported, inspected, and moved through allowed status transitions; each status update is saved to `orders`, recorded in `order_status_logs`, and added to the activity log. Reviews can be approved, flagged as spam, published, or removed; their moderation status is stored on the review record. Products, Categories, and Customers are managed from their database records; customer order counts and spend are calculated from `orders`. Inventory stock thresholds are saved in the current browser; restock actions update product stock in the database. Sales reports aggregate paid or delivered orders, and can be printed or saved as PDF from the browser print dialog. Activity logs record successful changes to products, categories, inventory, reviews, customers, and orders, along with admin sign-ins and sign-outs. Page views, searches, filters, and exports are not logged.

The SQL dump contains an admin account (`admin@scentare.test`) but only stores its password hash. Choose a password, generate a PHP bcrypt hash, then set it in phpMyAdmin:

```sh
php -r "echo password_hash('choose-a-password', PASSWORD_BCRYPT), PHP_EOL;"
```

```sql
UPDATE users SET password = 'paste-the-generated-hash' WHERE email = 'admin@scentare.test' AND role = 'admin';
```

Keep `backend/.env` private; it is excluded from source control. For Apache deployment, point the document root at `backend/public` for the API and serve the Vite build on the same site origin (or set `VITE_API_BASE_URL` to the API path).
