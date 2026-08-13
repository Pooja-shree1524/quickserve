# QuickServe — Customer Module (Member 1)

This is a working implementation of the **User Module (Customer Side)** of QuickServe, built on the tech
stack you specified: **React + Spring Boot + MySQL + Spring Security/JWT**.

```
quickserve-backend/     Spring Boot API (Java 17, Maven)
quickserve-frontend/    React + Vite + Tailwind CSS
```

## What's implemented

| Feature area | Details |
|---|---|
| Authentication | Register, Login, JWT issued on both, BCrypt password hashing |
| Profile | View / edit name & phone |
| Menu | List, search by name, filter by category, price & availability shown |
| Cart | Add, remove, change quantity, auto-calculated total |
| Orders | Place pre-order with a chosen pickup time, order history |
| Payment | Dummy payment gateway (always succeeds) with a `RAZORPAY` method stub ready to wire up a real key |
| Tracking | `Placed → Accepted → Preparing → Ready → Collected` pipeline, live-polled every 10s |
| AI prediction (basic) | `AiPredictionService` estimates wait time from each item's prep time + current kitchen load (active order count), and generates the token |

Database tables map 1:1 to your spec: `Users, Food, Cart(+CartItem), Orders, OrderItems, Payments`.

APIs match your list: `POST /register`, `POST /login`, `GET /foods`, `POST /cart`, `POST /order`,
`GET /orders`, `GET /track/{id}` — plus a handful of supporting endpoints (cart item update/delete,
profile, single order lookup, order status update for the admin/kitchen side).

## Running the backend

**Prerequisites:** Java 17+, Maven, a running MySQL server.

1. Create nothing manually — `application.properties` is set to
   `createDatabaseIfNotExist=true`, so MySQL just needs to be running.
2. Edit `quickserve-backend/src/main/resources/application.properties` if your MySQL
   username/password aren't `root` / `root`.
3. From `quickserve-backend/`:
   ```bash
   mvn spring-boot:run
   ```
   The API starts on `http://localhost:8080`. On first run, `DataSeeder` inserts 8 sample menu items.

4. Test quickly with curl or Postman:
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Asha","email":"asha@example.com","password":"secret123"}'
   ```
   Copy the returned `token` and pass it as `Authorization: Bearer <token>` on subsequent requests.

## Running the frontend

**Prerequisites:** Node.js 18+.

```bash
cd quickserve-frontend
npm install
cp .env.example .env      # points at http://localhost:8080/api by default
npm run dev
```
Opens on `http://localhost:3000`.

## Notes & next steps

- **Razorpay**: `PaymentService.processPayment()` has a clearly marked spot to swap in real
  order creation + signature verification once you have API keys — currently both `DUMMY` and
  `RAZORPAY` just succeed immediately so the full flow is demoable without a live key.
- **JWT secret**: the one in `application.properties` is a placeholder — move it to an environment
  variable before deploying anywhere real.
- **Admin/AI modules**: this deliverable only covers the Customer Module. The `PATCH /api/orders/{id}/status`
  endpoint is there so an Admin Module (Member 2) can drive the status pipeline; `AiPredictionService`
  is intentionally a simple, swappable heuristic so a more sophisticated model can replace it later
  without touching the controllers.
- The full customer flow works end-to-end: register → browse menu → add to cart → checkout with
  pickup time → dummy payment → token generated → live status tracking.
