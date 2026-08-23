#!/bin/sh
set -eu

whisper-server \
  --host 127.0.0.1 \
  --port 8080 \
  --threads "${WHISPER_THREADS:-2}" \
  --language vi \
  --convert \
  --model /opt/whisper/models/ggml-base.bin &

exec node apps/api/dist/main.js
