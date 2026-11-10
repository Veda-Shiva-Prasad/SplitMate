# 💰 SplitMate

A full-stack personal finance manager built with the MERN stack. Track expenses, plan budgets, save toward goals, manage recurring payments and keep a list of money others owe you.

[![CI](https://github.com/Veda-Shiva-Prasad/SplitMate/actions/workflows/ci.yml/badge.svg)](https://github.com/Veda-Shiva-Prasad/SplitMate/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

**Live app:** https://splitmate-finance.vercel.app (frontend on Vercel, API on Render)

> The API runs on a free Render plan, so the first request after a quiet period can take 30+ seconds while the server wakes up.

## Features

- **Accounts:** register, log in, JWT authentication, edit profile and photo, change password
- **Expenses:** add, list and delete expenses with categories; running totals
- **Budgets:** an overall monthly limit plus per-category monthly budgets with progress
- **Savings goals:** target, deadline and priority; add money; archive completed goals
- **Recurring payments:** weekly, monthly, quarterly or yearly bills with next-due dates
- **Money owed to you:** record who owes you what and mark entries settled
- **Custom categories:** your own categories with colour, icon and optional limit
- **Reports and activity:** charts built from your transactions, activity feed, notifications
- **Insights:** rule-based spending insights (top category, month-over-month change, budget health). These are calculated in the browser; there is no machine-learning or LLM component.
- **Data tools:** export and import transactions (JSON or CSV), clear all transactions
- **Dark and light theme**, responsive layout

## Tech stack

| Layer    | Technology                                                            |
| -------- | --------------------------------------------------------------------- |
| Frontend | React 19, React Router 7, Axios, Recharts, Create React App           |
| Backend  | Node.js, Express 5, Mongoose 8, JWT (jsonwebtoken), bcryptjs          |
| Security | helmet, CORS allow-list, rate limiting on login and registration      |
| Database | MongoDB (Atlas in production, a container locally)                    |
| Quality  | Jest and Supertest (API), React Testing Library (UI), GitHub Actions  |
| Delivery | Docker, Docker Compose, nginx; Vercel (frontend) and Render (API)     |

## Project structure

```
SplitMate/
├── client/                 React app (Create React App)
│   ├── src/pages/          Dashboard, Budget, Goals, Recurring, Reports, Settings ...
│   ├── src/context/        DataContext - loads user data from the API
│   ├── src/utils/api.js    Axios instance with auth header + 401 handling
│   ├── Dockerfile          Build with Node, serve with nginx
│   └── nginx.conf          Static hosting with SPA fallback
├── server/                 Express API
│   ├── app.js              Express app (middleware, routes) - imported by tests
│   ├── index.js            Connects to MongoDB and starts the server
│   ├── controllers/ models/ routes/ middleware/ utils/
│   ├── tests/              Jest + Supertest API tests
│   └── Dockerfile
├── docker-compose.yml      MongoDB + API + client in one command
└── .github/workflows/ci.yml
```

## Run it locally

### Option A: Docker (one command)

Requires Docker Desktop.

```bash
cp .env.example .env          # then put a real JWT_SECRET (32+ characters) inside
docker compose up --build
```

- App: http://localhost:8080
- API health check: http://localhost:5000/health

This starts MongoDB, the API and the nginx-served frontend. Stop it with `docker compose down` (add `-v` to delete the database volume).

### Option B: Without Docker

Requires Node.js 20 or newer and a MongoDB database (local or Atlas).

```bash
# API
cd server
cp .env.example .env          # edit MONGO_URI and JWT_SECRET
npm install
npm run dev                   # http://localhost:5000

# Frontend (new terminal)
cd client
cp .env.example .env          # REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start                     # http://localhost:3000
```

## Environment variables

| Variable            | Where  | Purpose                                                           |
| ------------------- | ------ | ----------------------------------------------------------------- |
| `MONGO_URI`         | server | MongoDB connection string                                         |
| `JWT_SECRET`        | server | Secret for signing tokens, at least 32 characters                 |
| `CLIENT_URL`        | server | Allowed browser origin(s), comma separated                        |
| `PORT`              | server | API port (default 5000)                                           |
| `REACT_APP_API_URL` | client | API base URL, fixed into the build at build time                  |

Real values live only in `.env` files (git-ignored) or in the hosting dashboards. Never commit them.

## Tests

```bash
cd server && npm test          # 33 API tests, no database required
cd client && npm test          # UI and API-client tests
```

## CI/CD

- **CI (GitHub Actions, on every push and pull request to `main`):**
  1. Server: install, run tests, audit production dependencies
  2. Client: install, run tests, production build
  3. Docker: build all images, start the full stack with Compose, then check the API health endpoint, the frontend (including a client-side route), and a real register and login against the containerised database
- **CD:** Vercel (frontend) and Render (API) deploy automatically from `main`.

## API overview

All routes except `/api/auth/register` and `/api/auth/login` require `Authorization: Bearer <token>`.

| Area       | Routes                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Auth       | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/change-password` |
| Expenses   | `GET/POST/DELETE /api/expenses`, `DELETE /api/expenses/:id`, `GET /api/expenses/summary` |
| Budgets    | `GET/POST /api/budgets`, `DELETE /api/budgets/:id`, `GET/PUT /api/budgets/limit` |
| Goals      | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id`, `POST /api/goals/:id/add` |
| Recurring  | `GET/POST /api/recurring`, `PUT/DELETE /api/recurring/:id`             |
| Owed       | `GET/POST /api/owed`, `PUT /api/owed/:id/settle`, `DELETE /api/owed/:id` |
| Categories | `GET/POST /api/categories`, `DELETE /api/categories/:name`             |
| Groups     | `GET/POST /api/groups` (API only, not yet used by the UI)              |

Every query is scoped to the logged-in user, so one user can never read or change another user's data.

## Known limitations and roadmap

- Group expense splitting is not built yet. The groups API exists, but the UI and per-member split and settle-up logic do not.
- Per-category budgets use a fixed list of categories and do not yet include custom categories.
- "Current month" is calculated on the server in UTC, so entries made just after midnight in India can fall into the previous month.
- Insights are rule-based. Adding an LLM-based summary is a possible future step.
- Notifications are stored in the browser, not on the server.

## Author

**Veda Shiva Prasad K** · [GitHub](https://github.com/Veda-Shiva-Prasad) · [LinkedIn](https://linkedin.com/in/vedashivaprasad)
