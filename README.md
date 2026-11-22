
# WedPlan — Backend API

A secure, scalable, and modular REST API for **WedPlan**, a wedding services marketplace connecting customers, vendors, and wedding professionals across Bangladesh.

Built with **Node.js 22**, **Express.js 5**, **MongoDB**, and modern JavaScript, the backend manages authentication, role-based authorization, service listings, booking requests, image processing, vendor subscriptions, and administrative operations.

## Project Information

| Information | Details |
|---|---|
| Project | WedPlan |
| Component | Backend REST API |
| Assignment | Assignment 9 — Category 004 |
| Author | Faruk Ahmed |
| Runtime | Node.js 22+ |
| Framework | Express.js 5 |
| Database | MongoDB |
| Authentication | Better Auth, Google OAuth |
| Payments | Stripe Checkout |
| Image Storage | MongoDB GridFS |
| Deployment | Vercel |

---

## Live Demo & Repository Links

| Resource | Link |
|---|---|
| Live Website | [WedPlan](https://wedplan-full-stack.vercel.app) |
| Backend Repository | [Server Side](https://github.com/srfarukahmed/WedPlan-Server-Side) |
| Frontend Repository | [Client Side](https://github.com/srfarukahmed/WedPlan-Client-Side) |


---

## Project Overview

WedPlan Backend provides the server-side infrastructure for a wedding services marketplace.

It is responsible for managing business operations, persistent data, authentication, subscriptions, and communication between users.

The system supports three primary roles:

- **Customer:** Browse services and manage booking requests.
- **Vendor:** Manage wedding service listings, bookings, and subscriptions.
- **Administrator:** Moderate listings, manage accounts, and monitor transactions.

The backend exposes REST endpoints consumed by the Next.js frontend.

### Core Responsibilities

- Secure authentication and session management.
- Role-based access control.
- MongoDB data persistence.
- Wedding service management.
- Booking workflow processing.
- Admin moderation.
- Stripe subscription integration.
- Image validation, processing, and storage.
- Input validation and error handling.

---

## Key Features

### Authentication & Authorization

- Email and password authentication.
- Google OAuth Sign-In.
- Better Auth session management.
- JWT and session verification.
- Role-based protected endpoints.
- Account blocking and access restrictions.
- Resource ownership validation.

### Wedding Service Management

- Vendor service creation.
- Service editing and deletion.
- Service image uploads.
- Admin approval and rejection.
- Service activation and deactivation.
- Public approved service listings.
- Service filtering and discovery.

### Booking Management

- Customer booking requests.
- Booking ownership verification.
- Vendor booking decisions.
- Booking status tracking.
- Pending request cancellation.
- Accepted and rejected booking states.

### Subscription Management

The platform offers Free and Premium vendor subscriptions.

**Free Plan**

- Up to three active service listings.
- Vendor dashboard access.
- Booking request management.
- Basic listing management.

**Premium Plan**

- Unlimited active service listings.
- Premium vendor badge.
- All Free plan features.
- Subscription validity tracking.
- Automatic renewal management.

Stripe handles payment collection, while the backend manages verified payment records and subscription state.

### Payment Processing

- Stripe-hosted Checkout.
- Test-mode subscriptions.
- Checkout session management.
- Stripe webhook signature verification.
- Payment transaction records.
- Subscription lifecycle handling.
- Subscription expiration management.
- Automatic renewal cancellation and resumption.

### Image Management

- JPEG, PNG, WebP, and AVIF support.
- Server-side file validation.
- Image optimization using Sharp.
- WebP conversion.
- MongoDB GridFS storage.
- Optional ImgBB image mirroring.
- Image delivery through API endpoints.

### Administrator Features

- User account management.
- Account blocking and unblocking.
- Service moderation.
- Listing approval and rejection.
- Transaction history monitoring.
- Administrative dashboard data.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js 22+ | JavaScript runtime |
| Express.js 5 | REST API framework |
| JavaScript ES Modules | Backend application logic |
| MongoDB | Persistent database |
| MongoDB GridFS | Image storage |
| Better Auth | Authentication and sessions |
| Google OAuth | Social authentication |
| JOSE | JWT verification |
| Zod | Request validation |
| Stripe | Checkout and subscriptions |
| Sharp | Image processing |
| ImgBB | Optional image hosting |
| Multer | File uploads |
| Helmet | HTTP security headers |
| CORS | Cross-origin access control |
| Express Rate Limit | Request rate limiting |
| Node.js Test Runner | Automated testing |
| Vercel | Cloud deployment |

---

## Backend Architecture

The backend follows a modular architecture with separate application, authentication, database, validation, image handling, and route modules.

```text
                  CLIENT APPLICATION
                    Next.js Frontend
                           |
                           | HTTPS / REST API
                           v
                  EXPRESS APPLICATION
                       src/app.js
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
    Authentication    Marketplace        Payments
      Better Auth       Routes          Stripe API
          |                |                |
          +----------------+----------------+
                           |
                           v
                     MongoDB Atlas
                           |
                +----------+----------+
                |                     |
                v                     v
          Business Records          GridFS
                |                 Image Storage
                v
        Users / Services /
        Bookings / Payments
```

---

## Project Folder Structure

```text
backend/
│
├── src/
│   │
│   ├── routes/
│   │   ├── marketplace.js
│   │   └── payments.js
│   │
│   ├── app.js
│   ├── auth.js
│   ├── config.js
│   ├── db.js
│   ├── images.js
│   ├── server.js
│   ├── validation.js
│   └── vercel.js
│
├── scripts/
│   └── seed.js
│
├── seed-assets/
│   └── ...
│
├── test/
│   ├── api.test.js
│   └── domain.test.js
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```

### File Responsibilities

| File / Directory | Responsibility |
|---|---|
| `src/server.js` | Local server startup and shutdown |
| `src/vercel.js` | Vercel Express entry point |
| `src/app.js` | Express middleware and API registration |
| `src/auth.js` | Better Auth and protected routes |
| `src/config.js` | Environment configuration and validation |
| `src/db.js` | MongoDB connection and data operations |
| `src/images.js` | Image processing, GridFS, and ImgBB |
| `src/validation.js` | Request validation and error utilities |
| `src/routes/marketplace.js` | Services, bookings, profiles, and admin features |
| `src/routes/payments.js` | Stripe Checkout, webhooks, and subscriptions |
| `scripts/seed.js` | Evaluation accounts and sample data |
| `seed-assets/` | Assets used during database seeding |
| `test/api.test.js` | API integration tests |
| `test/domain.test.js` | Domain and unit tests |
| `.env.example` | Environment configuration template |

---

## Getting Started

### Prerequisites

Install and configure the following:

- Node.js 22 or later
- npm
- Git
- MongoDB Atlas or a local MongoDB replica set
- Visual Studio Code (recommended)

Optional integrations:

- Google Cloud OAuth credentials
- Stripe test account
- ImgBB API key

### 1. Clone the Repository

For the standalone backend repository:

```bash
git clone https://github.com/srfarukahmed/WedPlan-Server-Side.git
cd WedPlan-Server-Side
```

For the full-stack repository:

```bash
git clone https://github.com/srfarukahmed/WedPlan-Full-Stack.git
cd WedPlan-Full-Stack/backend
```

### 2. Install Dependencies

```bash
npm ci
```

On Windows PowerShell:

```powershell
npm.cmd ci
```

### 3. Configure Environment Variables

Create a `.env` file using the supplied template.

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables before starting the backend.

### 4. Start the Development Server

```bash
npm run dev
```

The default local API origin is:

http://localhost:4000

### 5. Run the Production Server Locally

```bash
npm start
```

### 6. Verify the Backend

Open the health endpoint:

http://localhost:4000/health

Expected response:

```json
{
  "status": "ok"
}
```

Test the public services API:

```powershell
Invoke-RestMethod http://localhost:4000/api/services
```

The services API returns approved and active listings.

A fresh database may return an empty collection.

---

## Environment Configuration

The backend loads environment variables from `.env` during local development.

### Example Configuration

```dotenv
# Server
PORT=4000

# MongoDB
MONGODB_URI=
MONGODB_DB=wedplan

# Application Origins
FRONTEND_URL=http://localhost:3000
PUBLIC_API_URL=http://localhost:4000

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe Test Integration
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Image Hosting
IMGBB_API_KEY=

# Evaluation Accounts
FARUK_ADMIN_EMAIL=
FARUK_ADMIN_PASSWORD=

FARUK_VENDOR_EMAIL=
FARUK_VENDOR_PASSWORD=

FARUK_CUSTOMER_EMAIL=
FARUK_CUSTOMER_PASSWORD=
```

### Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Express server port |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | MongoDB database name |
| `FRONTEND_URL` | Frontend origin and payment return origin |
| `PUBLIC_API_URL` | Public API origin used in generated image URLs |
| `BETTER_AUTH_URL` | Browser-facing authentication origin |
| `BETTER_AUTH_SECRET` | Private Better Auth secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe test API secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe recurring subscription price |
| `IMGBB_API_KEY` | Optional external image hosting key |
| `FARUK_*_EMAIL` | Evaluation account emails |
| `FARUK_*_PASSWORD` | Evaluation account passwords |

### Security Notes

- Never commit `.env` files.
- Use long, unpredictable authentication secrets.
- Store production credentials in the hosting provider's environment settings.
- Never expose MongoDB connection strings or Stripe secrets to the frontend.
- Use different credentials for development and production.

---

## Database Configuration

WedPlan uses MongoDB for persistent application data.

The application stores information associated with:

- User accounts and authentication.
- Vendor profiles.
- Wedding services.
- Booking requests.
- Payment transactions.
- Subscription details.
- Image metadata and GridFS files.

### MongoDB Atlas Setup

1. Create a MongoDB Atlas project and cluster.
2. Create a database user.
3. Configure network access for your application.
4. Obtain the MongoDB connection string.
5. Set the connection string in `MONGODB_URI`.
6. Configure `MONGODB_DB`.
7. Start the backend and verify the health endpoint.

MongoDB transactions require a compatible deployment, such as MongoDB Atlas or a local replica set.

---

## Authentication & Authorization

Authentication is implemented with Better Auth.

Supported authentication methods include:

- Email and password.
- Google OAuth.
- Session-based authentication.

Protected API operations additionally enforce server-side permissions.

### User Roles

| Role | Permissions |
|---|---|
| Customer | Browse services and manage personal bookings |
| Vendor | Manage listings, booking requests, and subscriptions |
| Admin | Moderate listings, manage users, and inspect transactions |

### Security Controls

- Session verification.
- Protected API routes.
- Role checks.
- Resource ownership checks.
- Blocked-account restrictions.
- Request validation.
- Security response headers.

---

## Google OAuth Integration

Google Sign-In is supported through Better Auth.

### Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/auth/clients).
2. Create or select an OAuth Web Application client.
3. Configure the authorized JavaScript origins.
4. Configure the callback URL.
5. Copy the client ID and secret.
6. Set the backend environment variables.
7. Restart or redeploy the application.

### Local Development

Authorized JavaScript origin:

```text
http://localhost:3000
```

Authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

### Production

Authorized JavaScript origin:

```text
https://wedplan-full-stack.vercel.app
```

Authorized redirect URI:

```text
https://wedplan-full-stack.vercel.app/api/auth/callback/google
```

For this same-origin deployment, configure `BETTER_AUTH_URL` using the production frontend origin.

New users signing in through Google receive the Customer role.

---

## Stripe Checkout & Subscription Management

WedPlan integrates Stripe Checkout for vendor subscriptions.

The current integration uses Stripe test-mode credentials.

### Subscription Plans

| Feature | Free | Premium |
|---|---|---|
| Vendor dashboard | Yes | Yes |
| Booking management | Yes | Yes |
| Active services | Up to 3 | Unlimited |
| Premium badge | No | Yes |
| Subscription tracking | No | Yes |

### Payment Workflow

```text
Vendor selects Premium
          |
          v
Backend creates Stripe Checkout
          |
          v
Customer completes test payment
          |
          v
Stripe processes transaction
          |
          v
Stripe webhook notifies backend
          |
          v
Backend verifies payment
          |
          v
Transaction and subscription updated
          |
          v
Frontend displays subscription status
```

### Stripe Configuration

Set the following environment variables:

```dotenv
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

The configured price must be an active recurring Stripe test price.

### Local Webhook Testing

Install and authenticate the Stripe CLI.

Run:

```bash
stripe listen --events "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,checkout.session.expired,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed" --forward-to http://localhost:4000/api/payments/webhook
```

Copy the Stripe CLI webhook signing secret into:

```dotenv
STRIPE_WEBHOOK_SECRET=
```

Restart the backend after updating the environment.

### Production Webhook Endpoint

```text
https://wedplan-full-stack.vercel.app/api/payments/webhook
```

Configure this endpoint in the Stripe Dashboard and use the signing secret generated for that endpoint.

Local Stripe CLI and production endpoint signing secrets are different.

### Test Payment

Use Stripe test mode and an official test payment method.

Example test card:

```text
Card number: 4242 4242 4242 4242
Expiry: Any valid future date
CVC: Any valid three-digit value
```

After payment, verify:

- Checkout completed successfully.
- Webhook signature validation succeeded.
- Transaction status was updated.
- Subscription status was updated.
- The vendor dashboard reflects the current plan.

Payment success must be verified on the backend. The browser return URL alone is not sufficient proof of payment.

---

## Image Upload & Storage

The backend uses Sharp and MongoDB GridFS for image processing and storage.

### Supported Formats

- JPEG
- PNG
- WebP
- AVIF

### Upload Limits

| Environment | Maximum Image Size |
|---|---|
| Local Express server | 5 MB |
| Vercel entry point | 4 MB |

### Image Processing

1. Validate the uploaded file.
2. Inspect its supported format.
3. Process and convert the image to WebP.
4. Store the image in MongoDB GridFS.
5. Optionally mirror it to ImgBB.
6. Return the public image URL.

### ImgBB Integration

ImgBB is optional.

Configure:

```dotenv
IMGBB_API_KEY=
```

The application can continue serving images through GridFS when ImgBB is unavailable.

---

## REST API Overview

### System

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Database connectivity check |
| GET | `/api/integrations` | Integration availability |

### Authentication

| Route | Description |
|---|---|
| `/api/auth/*` | Better Auth endpoints |

### Marketplace

| Endpoint | Description |
|---|---|
| `/api/services` | Public approved services |
| `/api/services/:id` | Service details |
| `/api/profile` | Authenticated user profile |
| `/api/dashboard` | Role-based dashboard data |
| `/api/vendor/services/*` | Vendor service management |
| `/api/bookings/*` | Booking workflow |
| `/api/admin/*` | Administrative operations |

### Images

| Endpoint | Description |
|---|---|
| `/api/uploads` | Authenticated or permitted image upload |
| `/api/images/:id` | Image retrieval |

### Payments

| Endpoint | Description |
|---|---|
| `/api/payments/checkout` | Create or retrieve a checkout session |
| `/api/payments/plan` | Subscription information and management |
| `/api/payments/status` | Checkout payment status |
| `/api/payments/webhook` | Signed Stripe events |

Protected endpoints require valid authentication and the appropriate account role.

---

## API Validation & Error Handling

The backend uses Zod and Express middleware for request validation.

It includes handling for:

- Invalid request data.
- Authentication failures.
- Authorization failures.
- Missing resources.
- Invalid file uploads.
- Request size limitations.
- Payment integration errors.
- Internal server errors.

### Example Error Response

```json
{
  "message": "This API route does not exist."
}
```

Error handling is centralized in the Express application.

---

## Database Seeding

WedPlan includes a seed utility for evaluation accounts and sample marketplace data.

### Configure Evaluation Credentials

Set the relevant values in `.env`.

```dotenv
FARUK_ADMIN_EMAIL=
FARUK_ADMIN_PASSWORD=

FARUK_VENDOR_EMAIL=
FARUK_VENDOR_PASSWORD=

FARUK_CUSTOMER_EMAIL=
FARUK_CUSTOMER_PASSWORD=
```

### Run the Seed Script

```bash
npm run seed
```

### Seed Sample Catalog

```bash
npm run seed -- --catalog
```

The catalog option can create approved sample services for evaluation.

Use private testing credentials and avoid running seed operations against important production data without reviewing the script first.

---

## Testing

The backend uses Node.js's built-in test runner.

### Run Tests

```bash
npm test
```

On Windows:

```powershell
npm.cmd test
```


### Production Endpoints

Website:

```text
https://wedplan-full-stack.vercel.app
```

Backend health:

```text
https://wedplan-full-stack.vercel.app/health
```

Services API:

```text
https://wedplan-full-stack.vercel.app/api/services
```

### Environment Variables

Configure the required backend variables through Vercel project settings.

For the deployed same-origin application:

```dotenv
FRONTEND_URL=https://wedplan-full-stack.vercel.app
PUBLIC_API_URL=https://wedplan-full-stack.vercel.app
BETTER_AUTH_URL=https://wedplan-full-stack.vercel.app
```

Also configure MongoDB, authentication, Google OAuth, and Stripe credentials.

Never store secret values in the repository.

### Production Verification

After deployment, test:

1. Backend health endpoint.
2. Public services API.
3. User authentication.
4. Google Sign-In.
5. Customer and vendor dashboards.
6. Booking operations.
7. Image uploads and retrieval.
8. Stripe test Checkout.
9. Subscription activation.
10. Subscription renewal controls.

---

## Security Considerations

The backend incorporates multiple layers of security:

- Authentication and session validation.
- Role-based authorization.
- Resource ownership checks.
- Input validation with Zod.
- Security headers using Helmet.
- Configured CORS origins.
- Image upload validation.
- Request rate limiting.
- Stripe webhook signature validation.
- Protected environment variables.

Additional operational security practices include:

- Rotating compromised credentials.
- Reviewing deployment logs.
- Using HTTPS in production.
- Restricting database access.
- Maintaining separate development and production environments.
- Monitoring failed authentication and payment requests.

---

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run backend with file watching |
| `npm start` | Run backend normally |
| `npm run seed` | Create evaluation accounts |
| `npm run seed -- --catalog` | Seed sample service listings |
| `npm test` | Run automated tests |

---

## Assignment Requirement Coverage

| Requirement | Backend Implementation |
|---|---|
| User authentication | Better Auth and Google OAuth |
| Role-based authorization | Customer, Vendor, and Admin middleware |
| Persistent database | MongoDB |
| Service CRUD | Vendor service management |
| Service moderation | Admin approval workflow |
| Booking management | Customer requests and vendor decisions |
| Subscription system | Free and Premium plans |
| Payment integration | Stripe Checkout and webhooks |
| File uploads | Multer, Sharp, GridFS |
| Validation | Zod and middleware |
| API security | Helmet, CORS, role checks |
| Deployment | Vercel Express service |

---

## Author

**Faruk Ahmed**

Assignment 9 — Category 004

GitHub: https://github.com/srfarukahmed

Email: faruk@wedplan.com

---

## License

No open-source license has been specified for this repository. All rights remain with the respective copyright holder unless a license is added.

---

**WedPlan — Making Wedding Planning Easier Across Bangladesh.**
