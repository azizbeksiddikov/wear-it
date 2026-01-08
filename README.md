# Wear-It Backend

![Node.js](https://img.shields.io/badge/Node.js-24-green)
![Express](https://img.shields.io/badge/Express-5-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![License](https://img.shields.io/badge/License-ISC-orange)

Modern, high-performance E-commerce Backend API built with **Node.js 24**, **Express 5**, and **TypeScript**.

## 📖 Overview

**Wear-It** is a robust, scalable e-commerce backend designed to handle complex product management, secure member authentication, and efficient order processing. It features a dual-layered routing system: a modern REST API for client applications and an EJS-powered administrative dashboard for platform management.

## ✨ Key Features

- 🛍️ **Advanced Product Management**: Full CRUD with variants (size, color, etc.), multi-image support, and categorization.
- 👤 **Secure Member System**: JWT & Session-based authentication, RBAC (Role-Based Access Control), and profile management.
- 🛒 **Full Order Lifecycle**: Create, update, track, and manage orders with history tracking.
- 💬 **Engagement & Analytics**: Integrated review system, product view tracking, and analytical insights.
- 🔒 **Cloud-First Media**: Seamless integration with **Supabase** for high-performance asset storage.
- 🐳 **Enterprise DevOps**: Fully containerized with Node 24 Alpine, memory-capped containers, and optimized build steps.

## 🛠️ Tech Stack

### Core

- **Runtime**: Node.js 24 (Alpine)
- **Framework**: Express 5.x
- **Language**: TypeScript 5.9
- **Database**: MongoDB (Mongoose 9.x)

### Services & Libraries

- **Storage**: Supabase Storage
- **Auth**: JWT (jsonwebtoken) & Express Sessions
- **Rendering**: EJS
- **Validation/Utilities**: Multer, BcryptJS, Morgan, UUID, Moment

## 🚀 Quick Start

### Prerequisites

- **Node.js** 24.x
- **Docker** & **Docker Compose**
- **MongoDB** instance (or use local Docker setup)
- **Supabase** Project credentials

### Setup & Installation

1. **Clone & Install**

   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy the example environment files for both production and development:

   ```bash
   cp env.example .env
   cp env.example .env.dev
   ```

   _Update the `.env` files with your MongoDB details, Supabase keys, and session secrets._

3. **Development Mode**
   ```bash
   npm run dev
   ```

## 🐳 Docker Management

The project is optimized for containerized deployments using memory-efficient Alpine images.

### Automated Deployment

- **Production**: `./deploy_prod.sh`
- **Development**: `./deploy_dev.sh`

### Manual Commands

```bash
# Build
docker build -t wear-it-backend .

# Start Production (Compose)
docker-compose up -d

# Start Development (Compose)
docker-compose -f docker-compose.dev.yml up -d
```

## 🔌 API Reference

### REST API (`/api/v1`)

| Endpoint         | Method | Description                        | Auth    |
| :--------------- | :----- | :--------------------------------- | :------ |
| `/member/signup` | POST   | Register a new member              | Public  |
| `/member/login`  | POST   | Member authentication              | Public  |
| `/product/all`   | GET    | Retrieve all products with filters | Public  |
| `/product/:id`   | GET    | Detailed product info              | Hybrid  |
| `/order/create`  | POST   | Place a new order                  | Private |
| `/review/create` | POST   | Submit product feedback            | Private |

### Admin Dashboard (`/admin`)

| Endpoint          | Method | Description            |
| :---------------- | :----- | :--------------------- |
| `/`               | GET    | Dashboard overview     |
| `/users`          | GET    | User management panel  |
| `/product/all`    | GET    | Inventory management   |
| `/product/create` | POST   | List new catalog items |

## 📁 Project Structure

```text
wear-it-backend/
├── src/
│   ├── app.ts              # Express configuration & Middlewares
│   ├── server.ts           # Entry point
│   ├── controllers/        # Request handlers
│   ├── models/             # Business logic & services
│   ├── schema/             # Mongoose schemas
│   ├── libs/               # Utilities, database, & storage configs
│   ├── views/              # Admin UI (EJS)
│   └── public/             # Static assets (CSS/JS/Images)
├── scripts/                # Deployment and utility scripts
├── Dockerfile              # Multi-stage build definition
└── docker-compose.yml      # Orchestration config
```

## 🛠️ Scripts

- `npm run dev`: Hot-reloading development server.
- `npm run build`: Compiles TypeScript to `dist/`.
- `npm run start:prod`: Executes the production build.
- `npm start`: Runs source directly via `ts-node`.

## 📄 License

Distributed under the **ISC License**.
