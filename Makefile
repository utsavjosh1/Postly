.PHONY: setup up down logs restart clean shell-api shell-db backup-db restore-db help

# Default target
help:
	@echo "Postly Production Management"
	@echo "============================"
	@echo "Available commands:"
	@echo "  make setup       - Initial setup (check dependencies, generate secrets, .env)"
	@echo "  make up          - Start the production stack (detached)"
	@echo "  make down        - Stop the production stack"
	@echo "  make restart     - Restart all services"
	@echo "  make logs        - Follow logs for all services"
	@echo "  make clean       - Stop containers and remove volumes (WARNING: DATA LOSS)"
	@echo "  make shell-api   - Enter API container shell"
	@echo "  make shell-db    - Enter Postgres container shell"
	@echo "  make backup-db   - Create a backup of the database"
	@echo ""

setup:
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

up:
	@docker compose -f docker-compose.prod.yml up -d --remove-orphans
	@echo "Services started! Web: http://localhost, API: http://localhost:3000"

down:
	@docker compose -f docker-compose.prod.yml down

restart: down up

logs:
	@docker compose -f docker-compose.prod.yml logs -f

clean:
	@read -p "Are you sure you want to delete all data? [y/N] " ans && [ $${ans:-N} = y ]
	@docker compose -f docker-compose.prod.yml down -v
	@echo "Cleaned up containers and volumes."

shell-api:
	@docker compose -f docker-compose.prod.yml exec api sh

shell-db:
	@docker compose -f docker-compose.prod.yml exec postgres psql -U postly postly

backup-db:
	@mkdir -p backups
	@echo "Backing up database..."
	@docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postly postly > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup saved to backups/"
