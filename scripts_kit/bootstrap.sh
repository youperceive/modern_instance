#!/bin/bash

cd ../cloudwego_instance/api

# docker stop $(docker ps -aq)
# docker rm $(docker ps -aq)

# docker compose -f 'docker-compose.yml' up -d --build

make &

cd ../../modern_instance

pnpm run dev
