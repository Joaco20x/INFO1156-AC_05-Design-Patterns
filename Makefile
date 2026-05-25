.PHONY: install setup stup dev build lint format format-check test test-watch test-cov test-e2e clean docker-build run stop logs check-tools

DOCKER_IMAGE=design-patterns:dev
DOCKER_CONTAINER=design-patterns-app
DOCKER_NODE_MODULES_VOL=design_patterns_node_modules
DOCKER_PNPM_STORE_VOL=design_patterns_pnpm_store
DOCKER_DIST_VOL=design_patterns_dist

install:
	pnpm install

check-tools:
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "Docker no esta instalado. Instalalo aqui: https://docs.docker.com/engine/install/"; \
		exit 1; \
	fi
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "pnpm no esta instalado. Instalalo aqui: https://pnpm.io/installation"; \
		exit 1; \
	fi

setup: check-tools
	pnpm install
	pnpm prisma migrate deploy
	pnpm prisma generate

dev:
	pnpm run start:dev

build:
	pnpm run build

lint:
	pnpm run lint

format:
	pnpm run format

format-check:
	pnpm run format:check

test:
	pnpm test

test-watch:
	pnpm run test:watch

clean:
	rm -rf dist coverage node_modules

docker-build:
	docker build -t $(DOCKER_IMAGE) .

run: docker-build
	docker rm -f $(DOCKER_CONTAINER) >/dev/null 2>&1 || true
	docker volume create $(DOCKER_NODE_MODULES_VOL) >/dev/null
	docker volume create $(DOCKER_PNPM_STORE_VOL) >/dev/null
	docker volume create $(DOCKER_DIST_VOL) >/dev/null
	docker run --name $(DOCKER_CONTAINER) -p 3000:3000 -p 5555:5555 -e CI=true -e CHOKIDAR_USEPOLLING=true -e CHOKIDAR_INTERVAL=300 -v $(PWD):/app -v $(DOCKER_NODE_MODULES_VOL):/app/node_modules -v $(DOCKER_PNPM_STORE_VOL):/pnpm/store -v $(DOCKER_DIST_VOL):/app/dist $(DOCKER_IMAGE)

stop:
	docker rm -f $(DOCKER_CONTAINER)

logs:
	docker logs -f $(DOCKER_CONTAINER)
