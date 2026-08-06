# QuickServe — Smart Token & Queue Module (Member 3)

Rebuilt on your team's stack:

| Component | Technology |
|---|---|
| Backend | Spring Boot 3.2.5, Java 17 |
| Database | MySQL |
| ORM | Spring Data JPA (Hibernate) |
| Build tool | Maven |
| API docs | springdoc-openapi / Swagger UI |
| Frontend | React.js (Vite) |
| AI integration | REST client that calls Member 2's FastAPI service, with local fallback |

---

## 1. Project layout

```
quickserve-java/
├── backend/                          Spring Boot app (Maven)
│   ├── pom.xml
│   └── src/main/java/com/quickserve/tokenqueue/
│       ├── TokenQueueApplication.java
│       ├── config/        OpenApiConfig, RestTemplateConfig, CorsConfig
│       ├── entity/         Token, OrderItem, TokenStatus
│       ├── repository/    TokenRepository (Spring Data JPA)
│       ├── dto/            request/response payloads
│       ├── service/        QueueAlgorithmService (⭐ the algorithm),
│       │                    AiPredictionClient (Member 2 integration),
│       │                    TokenService
│       ├── controller/    TokenController (the 4 required APIs)
│       └── exception/     GlobalExceptionHandler
│   └── src/main/resources/application.properties
└── frontend/                          React app (Vite)
    └── src/
        ├── App.jsx, api.js, main.jsx
        └── pages/CustomerQueue.jsx, AdminPanel.jsx
```

## 2. Prerequisites

- **Java 17+** (`java -version`)
- **Maven** (or use your IDE's built-in Maven — IntelliJ/Eclipse both bundle one)
- **MySQL** running locally (or update the connection string for a cloud DB)
- **Node.js 18+** for the React frontend

## 3. Set up MySQL

```sql
CREATE DATABASE quickserve;
```

(Or skip this — `application.properties` has `createDatabaseIfNotExist=true`,
so Spring Boot will create it for you on first run.)

Then open `backend/src/main/resources/application.properties` and set your
own credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quickserve?createDatabaseIfNotExist=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=yourpassword
```

## 4. Run the backend

```bash
cd backend
mvn spring-boot:run
```

(Or open the `backend` folder as a Maven project in IntelliJ/Eclipse and
run `TokenQueueApplication.java` directly.)

Hibernate will auto-create the `tokens` and `token_items` tables
(`spring.jpa.hibernate.ddl-auto=update`).

Once it's up:
- API base: `http://localhost:8080/api`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- Raw OpenAPI spec: `http://localhost:8080/v3/api-docs`

Use Swagger UI or Postman to try `POST /api/generateToken` right away.

## 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`:
- `/` — the customer Live Queue Display (LED-style "Now Serving" board +
  order tracking with a "Ready" notification banner)
- `/admin` — the kitchen panel (generate tokens, advance status)

CORS is already configured in `CorsConfig.java` to allow `localhost:5173`
to call `localhost:8080`.

## 6. The 4 required APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/generateToken` | `{ customerName, items:[{name,complexity}] }` → creates a token |
| GET | `/api/queue` | Full live queue (waiting + preparing), AI-ranked |
| PUT | `/api/updateStatus` | `{ tokenNumber, status }` → advances Waiting→Preparing→Ready→Collected |
| GET | `/api/currentToken` | "Now serving" + next-up tokens for the display board |

Extra helper: `GET /api/token/{tokenNumber}` — used by the frontend to track
one order.

All are documented (with request/response schemas) in Swagger UI.

## 7. The queue algorithm

See `QueueAlgorithmService.java`. Every waiting order gets a priority score:

```
score = prepTime × 1.5
      + complexity × 2
      + kitchenLoad × 0.5 × (complexity / 3)
      − minutesWaited × 3
```

**Lower score = served sooner.** Simple/fast orders are pushed forward when
the kitchen is busy (Shortest-Job-Next style scheduling); the `− minutesWaited × 3`
term is *aging*, so a complex order is never starved behind an endless stream
of simple ones. Recalculated for every waiting token whenever one is created
or a status changes.

## 8. Integrating with Member 2's FastAPI AI Prediction Module

`AiPredictionClient.java` is the integration point. It's **off by default**
(`ai.service.enabled=false`) so this module works standalone. Once Member 2's
service is running:

1. Confirm their actual endpoint/contract (the client currently assumes
   `POST {base-url}/api/predict/prep-time` with
   `{ "items": [...], "kitchenLoad": n }` → `{ "estimatedPrepTimeMinutes": n }`
   — adjust `AiPredictionClient.predictPrepTimeMinutes()` to match whatever
   Member 2 actually returns).
2. Set in `application.properties`:
   ```properties
   ai.service.enabled=true
   ai.service.base-url=http://localhost:8001
   ```
3. `QueueAlgorithmService.resolvePrepTime()` will now prefer Member 2's
   prediction and only fall back to the local heuristic if that call fails
   or times out (2s connect / 3s read timeout — tune in `RestTemplateConfig`).

This is deliberately decoupled: your module keeps working in demos even if
Member 2's FastAPI service isn't running yet.

## 9. Testing with Postman

Import these into a new Postman collection (or just hit them directly):

```
POST http://localhost:8080/api/generateToken
Content-Type: application/json

{
  "customerName": "Priya",
  "items": [
    { "name": "Biryani", "complexity": 3 },
    { "name": "Raita", "complexity": 1 }
  ]
}
```

```
PUT http://localhost:8080/api/updateStatus
Content-Type: application/json

{ "tokenNumber": "A101", "status": "Preparing" }
```

## 10. Notes / things you may want to extend

- Notifications are currently "poll + detect Ready on the frontend." For
  real push notifications, add Firebase Cloud Messaging or a WebSocket
  (`spring-boot-starter-websocket`) and push instead of poll.
- Add Spring Security if you want to lock down `/admin` routes / the
  update-status API to authenticated staff only.
- `spring.jpa.hibernate.ddl-auto=update` is convenient for coursework;
  swap in Flyway migrations before this goes anywhere near production.
