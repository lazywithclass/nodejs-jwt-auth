#!/bin/bash
# this script starts all required server, except from redis,
# which you can easily spin up for free online at redislabs.com

cd auth-server
npm run compile-watch &
npm run start-dev &

cd ..
cd books-server
npm run start-dev &

cd ..
cd frontend
npm run start-dev
