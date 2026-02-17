# =============================================================================
# Metzudat HaLikud - Monorepo Makefile
# =============================================================================

.PHONY: setup run-mobile run-backend run-admin test-all test-flutter test-backend \
        build-android build-ios seed-db clean lint-all docker-up docker-down codegen \
        deploy-build deploy-up deploy-down deploy-logs

# ------ Setup ------

setup: ## Install all dependencies
	@echo "=== Installing Flutter dependencies ==="
	cd apps/mobile && flutter pub get
	@echo "=== Installing Backend dependencies ==="
	cd backend && npm install
	@echo "=== Installing Admin dependencies ==="
	cd admin && npm install
	@echo "=== Running Flutter code generation ==="
	cd apps/mobile && dart run build_runner build --delete-conflicting-outputs
	@echo "=== Setup complete ==="

# ------ Development ------

docker-up: ## Start Postgres + Redis containers
	docker-compose -f infra/docker-compose.yml up -d

docker-down: ## Stop dev containers
	docker-compose -f infra/docker-compose.yml down

run-mobile: ## Run Flutter app
	cd apps/mobile && flutter run

run-backend: ## Run NestJS server
	cd backend && npm run start:dev

run-admin: ## Run Next.js admin panel
	cd admin && npm run dev

# ------ Code Generation ------

codegen: ## Run Flutter build_runner code generation
	cd apps/mobile && dart run build_runner build --delete-conflicting-outputs

codegen-watch: ## Watch mode for code generation
	cd apps/mobile && dart run build_runner watch --delete-conflicting-outputs

# ------ Testing ------

test-all: test-flutter test-backend ## Run all tests

test-flutter: ## Run Flutter tests
	cd apps/mobile && flutter test --coverage

test-backend: ## Run NestJS tests
	cd backend && npm run test

test-e2e: ## Run backend E2E tests
	cd backend && npm run test:e2e

# ------ Linting ------

lint-all: ## Lint all projects
	cd apps/mobile && flutter analyze
	cd backend && npm run lint
	cd admin && npm run lint

# ------ Building ------

build-android: ## Build Android APK
	cd apps/mobile && flutter build apk --release

build-android-bundle: ## Build Android App Bundle
	cd apps/mobile && flutter build appbundle --release

build-ios: ## Build iOS IPA
	cd apps/mobile && flutter build ipa --release

build-backend: ## Build NestJS for production
	cd backend && npm run build

build-admin: ## Build Next.js for production
	cd admin && npm run build

# ------ Database ------

seed-db: ## Seed database with initial data
	cd backend && npm run seed

migrate: ## Run database migrations
	cd backend && npm run migration:run

migrate-generate: ## Generate a new migration
	cd backend && npm run migration:generate -- -n $(name)

# ------ Deployment ------

deploy-build: ## Build all Docker images locally
	docker build -t metzudat-backend:latest ./backend
	docker build -t metzudat-admin:latest ./admin
	docker build -t metzudat-nginx:latest ./infra/nginx

deploy-up: ## Start production containers
	docker compose -f infra/docker-compose.prod.yml up -d

deploy-down: ## Stop production containers
	docker compose -f infra/docker-compose.prod.yml down

deploy-logs: ## View production container logs
	docker compose -f infra/docker-compose.prod.yml logs -f

# ------ Cleanup ------

clean: ## Clean all build artifacts
	cd apps/mobile && flutter clean
	cd backend && rm -rf dist node_modules
	cd admin && rm -rf .next node_modules
	@echo "=== Cleaned ==="

# ------ Help ------

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
