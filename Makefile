DOCKER_IMAGE_NAME=screencapture
PROD_TAG=0.0.1

# Use any -slim version
NODE_VERSION=14.17.3-slim
NGINX_VERSION=1.23.1-alpine

clean:
	rm -rf .cache node_modules

dev/build:
	DOCKER_BUILDKIT=1 docker build \
		--build-arg NODE_VERSION=${NODE_VERSION} \
		--build-arg USER_NAME=user \
		--build-arg USER_UID=$(shell id -u) \
		--build-arg USER_GID=$(shell id -g) \
        -f devops/dev/Dockerfile \
        -t ${DOCKER_IMAGE_NAME} \
        .

dev/shell:
	docker run -it \
		--rm \
		--network host \
		-v ${PWD}:/app \
		${DOCKER_IMAGE_NAME} zsh

prod/build:
	DOCKER_BUILDKIT=1 docker build \
    	--build-arg NODE_VERSION=${NODE_VERSION} \
    	--build-arg NGINX_VERSION=${NGINX_VERSION} \
        -f devops/prod/Dockerfile \
        -t ${DOCKER_IMAGE_NAME}:${PROD_TAG} \
        .

prod/local:
	docker run -it --rm -p 8001:80 ${DOCKER_IMAGE_NAME}:${PROD_TAG}
