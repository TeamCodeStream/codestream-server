#!/bin/bash

cd $CS_API_TOP/sandbox/docker

# Setup gateway to host machine at 192.168.0.1
#docker network create -d bridge --subnet 192.168.0.0/24 --gateway 192.168.0.1 csdevnet

#export COMPOSE_PROJECT_NAME=csdev
set -x
docker-compose run --rm -p 12079:12079 api bin/cs_api-start-docker

#docker-compose -f ~/etc/codestream-development-with-docker.yml up
