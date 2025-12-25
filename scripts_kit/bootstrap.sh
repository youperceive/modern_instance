#!/bin/bash

cd ../cloudwego_instance/api

make &

cd ../../modern_instance

pnpm run dev
