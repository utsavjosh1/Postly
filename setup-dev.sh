#!/bin/bash

echo "🚀 Setting up JobBot development environment with Prisma ORM..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Copy environment files
echo "📝 Setting up environment files..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created root .env file"
fi

if [ ! -f apps/web/.env ]; then
  cp apps/web/.env.example apps/web/.env
  echo "✅ Created web .env file"
fi

if [ ! -f apps/server/.env ]; then
  cp apps/server/.env.example apps/server/.env
  echo "✅ Created server .env file"
fi

echo ""
echo "🔧 Setting up Prisma..."
cd apps/server

# Generate Prisma client
echo "📦 Generating Prisma client..."
bunx prisma generate

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your database connection string in apps/server/.env"
echo "   DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres\""
echo ""
echo "2. Run the database schema:"
echo "   Execute the SQL in supabase-schema.sql in your Supabase SQL editor"
echo ""
echo "3. Optionally run database migration (after setting up DATABASE_URL):"
echo "   cd apps/server && bunx prisma db push"
echo ""
echo "4. Start the development servers:"
echo "   bun run dev"
echo ""
echo "🔐 For Google OAuth, update these environment variables:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - GOOGLE_CALLBACK_URL"
echo "   - SESSION_SECRET"