FROM node:lts-bookworm-slim AS build

WORKDIR /build

# these packages are needed by the "npm install" and "npm run build-parsers" steps related to the grammar packages
RUN apt-get update && apt-get install -y \
    emscripten \
    make \
    gcc \
    g++ \
    parallel \
    python3


COPY package.json package-lock.json /build/
RUN npm install

COPY build-parsers.sh /build/
RUN BUILDERS_COUNT=10 npm run build-parsers

COPY .vscodeignore LICENSE.md README.md tsconfig.json /build/