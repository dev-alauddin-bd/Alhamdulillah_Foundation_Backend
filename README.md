# Alhamdulillah Foundation - Backend API

NestJS-based REST API for the Alhamdulillah Foundation investment management platform.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based secure authentication
  - Role-Based Access Control (RBAC): Super Admin, Admin, Moderator, User
- 👥 **User Management**
  - Profile management
  - Role assignment
- 🏗️ **Project Management**
  - Full CRUD for investment projects
  - Member management and tracking
- 🤝 **Join Request System**
  - Workflow for users to request joining projects
  - Approval/Rejection process by Admins
- 💰 **Fund Management**
  - Income and Expense tracking
  - Expense Request system with approval workflow
  - Financial summaries and history

- 💳 **Payment Integration**
  - **SSLCommerz** (Bangladesh payment gateway)
  - **SSLCommerz** (Local payments: bKash, Nagad, etc.)
  - Manual Bkash verification flow
- 🎯 **Banner Management**
  - Dynamic home page banners
- 📊 **Statistics & Analytics**
  - Dashboard analytics for admins
- 💼 **Management Board**
  - Manage foundation members/staff profiles
- ⚡ **Performance & Security**
  - **Redis** caching support
  - **Helmet** for HTTP headers security
  - **Throttler** for rate limiting
  - **Class-Validator** for input validation

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Caching**: Redis (ioredis)
- **Authentication**: Passport-JWT
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger UI
- **Payment**: SSLCommerz

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Redis (Optional, for caching)

## Installation

1.  **Clone the repository**
    ```bash
    git clone <repository_url>
    cd backend
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    ```bash
    cp .env.example .env
    ```

4.  **Configure `.env`**
    Update the `.env` file with your credentials:

    ```env
    # Application
    NODE_ENV=development
    PORT=5000
    FRONTEND_URL=http://localhost:3000

    # Database
    MONGO_URI=mongodb://localhost:27017/alhamdulillah_foundation
    REDIS_URL=


    # JWT Security
    JWT_ACCESS_SECRET=your_super_secret_access_key
    JWT_REFRESH_SECRET=your_super_secret_refresh_key
    JWT_ACCESS_EXPIRES=15m
    JWT_REFRESH_EXPIRES=7d

    # Cloudinary (File Uploads)
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Payment Gateways
    SSLCOMMERZ_STORE_ID=your_store_id
    SSLCOMMERZ_STORE_PASS=your_store_password
    SSLCOMMERZ_IS_LIVE=false
    ```

## Running the Application

**Development Mode**
```bash
npm run start:dev
```

**Production Mode**
```bash
npm run build
npm run start:prod
```

The API will run at `http://localhost:5000/api` (default).

## API Documentation (Swagger)

A full interactive API documentation is available via Swagger UI.
After starting the application, visit:

👉 **http://localhost:5000/docs**

## Project Structure

```
src/
├── app.module.ts        # Main application module
├── main.ts              # Entry point
├── auth/                # Authentication & JWT
├── user/                # User management
├── project/             # Project & Member management
├── fund/                # Financial transactions & Expense requests
├── payment/             # Payment gateways (SSLCommerz)
├── notice/              # Notice board management
├── banner/              # Banner management
├── stats/               # Dashboard statistics
├── management/          # Board members/Staff management
├── notification/        # Notification system

├── common/              # Shared logic (Guards, Decorators, Filters)
└── config/              # Configuration files
```

## Testing

Run the test suite using Jest:

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Security Best Practices

For production deployments:
1.  **Strict CORS**: Set `FRONTEND_URL` to your actual frontend domain.
2.  **Strong Secrets**: Use long, random strings for `JWT_SECRET` and Payment keys.
3.  **Rate Limiting**: Adjust `THROTTLE_TTL` and `THROTTLE_LIMIT` in `app.module.ts` or env.
4.  **Database Auth**: Ensure MongoDB connection string includes authentication.
5.  **Secure Headers**: Helmet is enabled by default.

## License

This project is licensed under the MIT License.
# Alhamdulillah-foundation-backend
