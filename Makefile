image_name = klakegg/hugo:0.91.2-ext

docker_run = docker run \
	--rm \
	--interactive \
	--tty \
	--user=$(shell id -u):$(shell id -g) \
	--mount type=bind,source=$(shell pwd),target=/src \
	--workdir="/src"

server:
	${docker_run} \
		--publish="1313:1313" \
		${image_name} server \
		--appendPort \
		--port 1313 \
		--noHTTPCache \
		--baseURL=http://localhost \
		--buildFuture \
		--buildDrafts
