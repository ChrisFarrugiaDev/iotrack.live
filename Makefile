pw ?=

HASHED_PASSWORD = effa4822613d21714b52ff776576f05a564eb2ad30ad7328c0f6e071a2240ad8026bbcb91e217a5e42cd380e496b1c390d65ad3ceeddf082d634859f05a0db4f

ENCRYPT_SCRIPT = ./scripts/encrypt.sh
DECRYPT_SCRIPT = ./scripts/decrypt.sh
DOCKER_COMPOSE_FILE = ./docker-compose.yml

define require_password
	@if [ -z "$(pw)" ]; then \
		echo "PASSWORD is not set. Usage: make $@ pw=<password>"; \
		exit 1; \
	fi; \
	hashed="`echo -n $(pw) | sha512sum | awk '{print $$1}'`"; \
	if [ "$$hashed" != "$(HASHED_PASSWORD)" ]; then \
		echo "PASSWORD does not match"; \
		exit 1; \
	fi
endef

encrypt:
	$(call require_password)
	chmod +x $(ENCRYPT_SCRIPT)
	$(ENCRYPT_SCRIPT) $(pw)

decrypt:
	$(call require_password)
	chmod +x $(DECRYPT_SCRIPT)
	$(DECRYPT_SCRIPT) $(pw)

docker-up:
	$(call require_password)
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d

docker-down:
	$(call require_password)
	docker-compose -f $(DOCKER_COMPOSE_FILE) down

sync:
	# rsync -az --delete --exclude=node_modules --exclude='prisma' --exclude='generated' -e "ssh -i ~/.ssh_iot/id_ecdsa" ~/c/Chris/projects/iotrack.live-main/ ubuntu@57.129.22.122:/home/ubuntu/projects/iotrack.live

	rsync -az --delete --exclude=node_modules --exclude='prisma' --exclude='generated' --exclude='parser' -e "ssh -i ~/.ssh/ssh_iot/id_ecdsa"  /home/foxcodenine/foxfiles/git/chrisfarrugia.dev/iotrack.live/ ubuntu@57.129.22.122:/home/ubuntu/projects/iotrack.live

post-codec12:
	curl -X POST http://57.129.22.122:3000/teltonika-parser/codec12/commands/864636060448814 \
		-H "Content-Type: application/json" \
		-d '{"commands": ["getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps", "getgps"]}'

auth-build:
	cd web.backend.node.ts.auth && \
	npm install && \
	npm run prisma-pull && \
	npm run prisma-generate && \
	npm run build

teltonika-parser-docker-build:
	cd teltonika.parser.go && \
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o teltonika-parser ./cmd/parser

auth-docker-build:
	cd web.backend.node.ts.auth && \
	docker build --no-cache -t iotrack-auth .

docker-up:	
	sudo docker compose up -d 

docker-down:	
	sudo docker compose down





