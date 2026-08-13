# QuickServe — Member 4: Admin Dashboard

Full-stack implementation of the Admin Dashboard module for QuickServe (AI-enabled pre-order & token management app).

## What's included

**Backend** (`/backend`) — Spring Boot 3 / Java 17 / MySQL / Spring Data JPA / Spring Security + JWT
- Food CRUD: `POST /api/admin/food`, `PUT /api/admin/food/{id}`, `DELETE /api/admin/food/{id}`, `GET /api/admin/food`
- Order Management: `GET /api/admin/orders`, `PUT /api/admin/orders/status` (accept/reject/preparing/ready/collected)
- Dashboard summary cards: `GET /api/admin/dashboard`
- User Management: `GET /api/admin/users`, `PUT /api/admin/users/{id}/block`, `PUT /api/admin/users/{id}/unblock`
- Analytics: `GET /api/admin/analytics` (orders/day, peak hours, most-ordered food, 7-day revenue, avg wait)
- AI Dashboard: `GET /api/admin/ai-dashboard` (current crowd, predicted crowd, avg waiting time, kitchen load)
- JWT login: `POST /api/auth/login`

**Frontend** (`/frontend`) — React 18 + Vite + Tailwind CSS + Recharts + Axios + React Router
- Dashboard, Food Management, Order Management, User Management, Analytics, AI Dashboard screens
- JWT stored in `localStorage`, auto-attached to every request, auto-redirect to `/login` on 401

## Running it locally

### 1. Database
Install MySQL and make sure it's running on `localhost:3306`. The app auto-creates the `quickserve` schema on first boot (`createDatabaseIfNotExist=true`).

### 2. Backend
```bash
cd backend
# edit src/main/resources/application.properties if your MySQL user/password differ
mvn spring-boot:run
```
Runs on `http://localhost:8080`. On first boot it seeds a default admin login:
- **email:** `admin@quickserve.com`
- **password:** `Admin@123`

> Change `jwt.secret` in `application.properties` (or load it from an environment variable) before deploying anywhere real.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # points the app at http://localhost:8080 by default
npm run dev
```
Runs on `http://localhost:5173`. Log in with the seeded admin account above.

## Notes on the AI features

The "AI Prediction Module" pieces (estimated wait time, peak-hour crowd forecast, kitchen load) are implemented as **explainable rule-based heuristics** in `OrderService.estimateWaitMinutes()` and `AiPredictionService`, not a trained ML model:
- **Estimated wait** = the slowest item's average prep time + a queue penalty based on how many orders are currently being worked on.
- **Predicted crowd** compares the current hour against historical order volume for that same hour over the last 7 days.
- **Kitchen load** buckets the count of active (accepted/preparing) orders into LIGHT / NORMAL / BUSY / OVERLOADED.

This keeps the module fully functional with zero external ML dependency, and the API contract (`GET /api/admin/ai-dashboard`) is designed so a real model can be swapped in later — e.g. by whichever teammate owns the AI Prediction Module — without any frontend changes.

## Project structure
```
backend/
  src/main/java/com/quickserve/admin/
    entity/        Food, FoodOrder, OrderItem, User, OrderStatus, Role
    repository/     Spring Data JPA repositories (incl. analytics queries)
    service/        FoodService, OrderService, UserService, AnalyticsService, AiPredictionService
    controller/      REST controllers matching the API spec
    config/         JWT + Spring Security config, DataSeeder
    dto/            Request/response DTOs
frontend/
  src/
    api/            axios client + endpoint wrappers
    context/        AuthContext (JWT session)
    components/admin/  DashboardCards, FoodManagement, OrderManagement, UserManagement, Analytics, AIDashboard
    pages/          Login, AdminDashboardPage
```
