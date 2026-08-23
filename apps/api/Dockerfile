FROM node:22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

COPY apps/api apps/api
COPY packages/contracts packages/contracts
RUN npm run build --workspace @telebot/contracts && npm run build --workspace @telebot/api

FROM alpine:3.21 AS whisper-builder

RUN apk add --no-cache cmake curl g++ git make
WORKDIR /opt
RUN git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git && \
    cmake -S whisper.cpp -B whisper.cpp/build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build whisper.cpp/build --target whisper-server -j"$(nproc)" && \
    whisper.cpp/models/download-ggml-model.sh base whisper.cpp/models

FROM node:22-alpine AS runner

WORKDIR /app
RUN apk add --no-cache ffmpeg libgomp libstdc++ python3 make g++
ENV NODE_ENV=production
EXPOSE 3000

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --omit=dev --workspace @telebot/api

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=whisper-builder /opt/whisper.cpp/build/bin/whisper-server /usr/local/bin/whisper-server
COPY --from=whisper-builder /opt/whisper.cpp/models/ggml-base.bin /opt/whisper/models/ggml-base.bin
COPY apps/api/scripts/start-with-whisper.sh /usr/local/bin/start-with-whisper.sh
RUN chmod +x /usr/local/bin/start-with-whisper.sh
CMD ["/usr/local/bin/start-with-whisper.sh"]
