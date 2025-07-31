# JobBot - Full-Stack Authentication System

A production-ready full-stack application with Supabase authentication, built with modern technologies and ready for GCP deployment.

## 🚀 Features

- **Secure Authentication**: Complete auth system with Supabase
- **TypeScript**: End-to-end type safety
- **Modern Stack**: React, Express.js, Bun runtime
- **Production Ready**: Security headers, rate limiting, error handling
- **Cloud Deployment**: Optimized for Google Cloud Platform
- **Monorepo Structure**: Organized with Turbo

## 🏗️ Architecture

```
jobbot/
├── apps/
│   ├── server/          # Express.js API server
│   │   ├── src/
│   │   │   ├── config/     # Environment & Supabase config
│   │   │   ├── controllers/# Route controllers
│   │   │   ├── middlewares/# Auth & security middleware
│   │   │   ├── routes/     # API routes
│   │   │   ├── services/   # Business logic
│   │   │   └── types/      # TypeScript types
│   │   └── Dockerfile      # Container config
│   └── web/             # React frontend
│       ├── src/
│       │   ├── components/ # React components
│       │   ├── context/    # Auth context
│       │   ├── config/     # Environment config
│       │   └── types/      # TypeScript types
├── packages/            # Shared packages
└── supabase-schema.sql  # Database schema
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Bun (fast JavaScript runtime)
- **Framework**: Express.js with TypeScript
- **Authentication**: Supabase Auth + JWT
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, Rate limiting
- **Database**: Supabase PostgreSQL

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with inline styles (customizable)
- **State Management**: React Context + Hooks
- **Routing**: React Router DOM

### Infrastructure
- **Deployment**: Google Cloud Platform
- **Server**: Cloud Run (containerized)
- **Frontend**: Firebase Hosting
- **Database**: Supabase (managed PostgreSQL)
- **Monitoring**: Cloud Logging & Monitoring

## 🚦 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) runtime
- [Supabase](https://supabase.com/) account
- [Google Cloud](https://cloud.google.com/) account (for deployment)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd jobbot

# Run setup script
chmod +x setup-dev.sh
./setup-dev.sh

# Or manually:
bun install
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

### 2. Configure Supabase

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Get your project URL and keys from Settings > API
4. Update your `.env` files with the credentials

### 3. Environment Configuration

#### Root `.env`:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_32_chars_min
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### `apps/web/.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Start Development

```bash
# Start both server and web app
bun run dev

# Or individually:
bun run dev:server  # Server on http://localhost:3000
bun run dev:web     # Web app on http://localhost:5173
```

## 🔐 Authentication Features

### User Management
- **Registration**: Email + password with profile data
- **Login**: Secure session management
- **Profile Updates**: Edit user information
- **Password Management**: Change password, reset via email
- **Session Handling**: Automatic token refresh

### Security Features
- **Row Level Security**: Supabase RLS policies
- **Rate Limiting**: Configurable limits per endpoint
- **JWT Validation**: Custom JWT + Supabase token verification
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Zod schema validation
- **Security Headers**: Helmet.js security headers

### API Endpoints

#### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh session
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `POST /request-password-reset` - Request password reset
- `GET /health` - Auth service health check

#### User Routes (`/api/users`)
- `GET /` - Get all users (with optional auth)
- `GET /me` - Get current user (protected)

## 🚀 Production Deployment

### Google Cloud Platform

See `GCP_DEPLOYMENT.md` for detailed deployment instructions.

#### Quick Deploy:
```bash
# Server (Cloud Run)
cd apps/server
bun run build
docker build -t gcr.io/YOUR_PROJECT_ID/jobbot-server .
docker push gcr.io/YOUR_PROJECT_ID/jobbot-server
gcloud run deploy jobbot-server --image gcr.io/YOUR_PROJECT_ID/jobbot-server

# Web App (Firebase Hosting)
cd apps/web
bun run build
firebase deploy --only hosting
```

## 🧪 Development Scripts

```bash
# Development
bun run dev          # Start all services
bun run dev:server   # Start server only
bun run dev:web      # Start web app only

# Building
bun run build        # Build all apps
bun run build:server # Build server only
bun run build:web    # Build web app only

# Linting & Formatting
bun run lint         # Lint all code
bun run format       # Format all code
```

## 📊 Project Structure Details

### Server (`apps/server`)
- **config/**: Environment variables and Supabase client setup  
- **controllers/**: Request handlers with validation
- **middlewares/**: Authentication, security, and error handling
- **routes/**: API route definitions
- **services/**: Business logic and external service integration
- **types/**: TypeScript type definitions

### Web App (`apps/web`)
- **components/**: Reusable React components
- **context/**: React Context for state management
- **config/**: Environment and configuration
- **types/**: TypeScript type definitions

### Shared (`packages/`)
- **ui/**: Shared UI components
- **eslint-config/**: Shared ESLint configuration
- **typescript-config/**: Shared TypeScript configuration

## 🔧 Configuration

### Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Run the provided SQL schema
3. Configure authentication settings
4. Set up RLS policies (included in schema)
5. Get API keys from project settings

### Security Configuration
- **CORS**: Configure allowed origins in production
- **Rate Limiting**: Adjust limits based on your needs
- **JWT Secret**: Use a strong, unique secret in production
- **Environment Variables**: Never commit production secrets

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Run linting and formatting
6. Submit a pull request

## 📜 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the `GCP_DEPLOYMENT.md` for deployment help
- Review the `supabase-schema.sql` for database setup
- Open an issue for bugs or feature requests

---

Built with ❤️ using React, Express.js, Supabase, and deployed on GCP.
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
