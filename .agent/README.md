# ScaleOn Commerce Engine (SCE) - Agent Documentation

This folder contains comprehensive documentation for AI agents working on this codebase.

## Quick Start for Agents

**ALWAYS READ THESE FILES FIRST** before making any code changes:

1. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and principles
2. [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Code organization and patterns
3. [API_REFERENCE.md](./API_REFERENCE.md) - Backend API endpoints
4. [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) - React component structure
5. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - MongoDB models and relationships

## Critical Architecture Rules

⚠️ **DO NOT VIOLATE THESE PRINCIPLES:**

1. **Configuration-Driven**: All business values (shipping rates, tax, thresholds) come from `backend/config/defaults.json` or database via ConfigService. NEVER hardcode prices/rates in frontend.

2. **Server-Controlled State**: Order status, payment status, and inventory are ONLY modified through backend services. Frontend cannot directly set these values.

3. **Thin Frontend**: Frontend only displays data and collects input. All calculations (totals, tax, shipping) happen on the server.

## Project Structure Overview

```
Module_E-Com/
├── backend/                 # Express.js API server
│   ├── config/              # Configuration (constants, defaults.json)
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/              # Mongoose schemas (9 models)
│   ├── routes/              # API endpoints (9 route files)
│   ├── services/            # Business logic (7 services)
│   └── scripts/             # Seed data scripts
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth, Cart, Config providers
│   │   ├── layouts/         # Main and Admin layouts
│   │   ├── pages/           # Route components
│   │   ├── services/        # API client (api.js)
│   │   └── utils/           # Helpers, security utilities
└── docs/                    # Deployment documentation
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, React Router 6 |
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Auth | JWT with refresh tokens |
| State | React Context (Auth, Cart, Config) |
| Styling | TailwindCSS with custom design system |

## Environment

- Development: `npm run dev` (both frontend and backend)
- Admin URL: http://localhost:5173/admin
- API URL: http://localhost:5001/api
- Admin Login: admin@store.com / Admin@123456
