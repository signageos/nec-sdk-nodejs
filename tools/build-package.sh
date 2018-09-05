#!/bin/sh
set -e

cp README.md dist
cp index.html dist/client/index.html
cp node_modules/@signageos/front-display/dist/webWorker.js dist/client/webWorker.js
cp tools/ffmpeg-extract-video-last-frame.sh dist
